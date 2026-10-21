import { NextResponse, type NextRequest } from "next/server";
import { getAccessCookieHeader } from "@/features/auth/services/session-cookie";
import { resolveExportTarget } from "@/features/exports/export-targets";
import { getAuthGatewayHeaders, getComsApiBaseUrl } from "@/lib/server-env";

function failure(status: number, message: string) {
  return NextResponse.json(
    { message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

// Streams a CSV from the API with the caller's session; downloads cannot use
// Server Actions, so this route forwards only allowlisted exports.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const target = resolveExportTarget(
    (await params).kind,
    request.nextUrl.searchParams,
  );
  if (!target) return failure(404, "This export is not available.");
  const headers = new Headers(getAuthGatewayHeaders());
  const cookie = getAccessCookieHeader(request.headers.get("cookie"));
  if (cookie) headers.set("cookie", cookie);
  let response: Response;
  try {
    response = await fetch(`${getComsApiBaseUrl()}${target}`, {
      headers,
      cache: "no-store",
      redirect: "error",
    });
  } catch {
    return failure(502, "COMS could not reach the server. Try again.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    if (response.status === 401)
      return failure(401, "Your session expired. Sign in again.");
    if (response.status === 403)
      return failure(403, "You don't have access to this export.");
    return failure(
      response.status,
      typeof body?.message === "string"
        ? body.message
        : "COMS could not create the export. Try again.",
    );
  }
  return new Response(response.body, {
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "content-disposition":
        response.headers.get("content-disposition") ??
        'attachment; filename="coms-export.csv"',
      "cache-control": "no-store",
    },
  });
}
