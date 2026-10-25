import "server-only";
import { z } from "zod";
import { getAccessCookieHeader } from "@/features/auth/services/session-cookie";
import { getAuthGatewayHeaders, getComsApiBaseUrl } from "@/lib/server-env";
import { offlineTarget } from "./server-target";

const BODY_LIMIT = 1024 * 1024;
// Compare hosts the way Next.js protects server actions: behind a TLS proxy the
// handler sees http:// while the browser's Origin is https://.
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const expected =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const site = request.headers.get("sec-fetch-site");
  return host === expected && (site === null || site === "same-origin");
}
function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie" },
  });
}
async function limitedJson(request: Request) {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    throw 415;
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) throw 413;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > BODY_LIMIT) {
      await reader.cancel();
      throw 413;
    }
    chunks.push(chunk.value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw 400;
  }
}

export async function handleOfflineRequest(request: Request, path: string[]) {
  const url = new URL(request.url);
  const target = offlineTarget(request.method, path, url.searchParams);
  if (!target)
    return json(
      { message: "This offline POS operation is not available." },
      404,
    );
  const context = path.length === 1 && path[0] === "context";
  if (request.method !== "GET") {
    if (!sameOrigin(request))
      return json({ message: "Open COMS on this site to continue." }, 403);
  }
  const cookie = getAccessCookieHeader(request.headers.get("cookie"));
  if (!cookie)
    return json(
      {
        message:
          "Sign in again to continue. Local sales remain on this device.",
      },
      401,
    );
  let body: unknown;
  if (target.schema) {
    try {
      const parsed = target.schema.safeParse(await limitedJson(request));
      if (!parsed.success)
        return json({ message: "Check the offline POS request." }, 400);
      body = parsed.data;
    } catch (error) {
      return json(
        { message: "Send a valid JSON request within the upload limit." },
        typeof error === "number" ? error : 400,
      );
    }
  }
  const headers = new Headers(getAuthGatewayHeaders());
  headers.set("cookie", cookie);
  headers.set("accept", "application/json");
  if (body !== undefined) headers.set("content-type", "application/json");
  try {
    const upstream = await fetch(`${getComsApiBaseUrl()}${target.endpoint}`, {
      method: request.method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    if (context && upstream.ok) {
      const parsed = z
        .object({ user_id: z.uuid(), enabled: z.boolean() })
        .safeParse(data);
      if (!parsed.success)
        return json({ message: "Unable to validate your account." }, 502);
      return json(parsed.data);
    }
    if (!upstream.ok) {
      const safe =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : {};
      return json(
        {
          message:
            upstream.status >= 500
              ? "COMS could not complete this request. Try again."
              : typeof safe.message === "string"
                ? safe.message
                : "This operation could not be completed.",
          ...(typeof safe.code === "string" ? { code: safe.code } : {}),
        },
        upstream.status,
      );
    }
    return json(data);
  } catch {
    return json(
      {
        message:
          "COMS could not reach the server. Local sales remain on this device.",
      },
      502,
    );
  }
}
