import { afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { requestComsApi } from "./server-api-services";

vi.mock("server-only", () => ({}));

describe("server COMS API requests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards only the access cookie and keeps the gateway secret server-side", async () => {
    const gatewaySecret = randomBytes(32).toString("hex");
    vi.stubEnv("COMS_API_BASE_URL", "https://api.example.test/");
    vi.stubEnv("COMS_AUTH_GATEWAY_SECRET", gatewaySecret);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestComsApi<{ items: unknown[] }>("/roles", {
        cookieHeader:
          "theme=dark; coms_access=access-token; coms_refresh=refresh-token",
      }),
    ).resolves.toEqual({ items: [] });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(url).toBe("https://api.example.test/roles");
    expect(headers.get("cookie")).toBe("coms_access=access-token");
    expect(headers.get("x-coms-auth-gateway")).toBe(gatewaySecret);
    expect(init.cache).toBe("no-store");
  });

  it("does not forward unrelated cookies when there is no access cookie", async () => {
    vi.stubEnv("COMS_AUTH_GATEWAY_SECRET", randomBytes(32).toString("hex"));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetchMock);

    await requestComsApi("/roles", {
      cookieHeader: "theme=dark; coms_refresh=refresh-token",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).has("cookie")).toBe(false);
  });

  it("forwards a feature idempotency header without replacing the gateway header", async () => {
    const gatewaySecret = randomBytes(32).toString("hex");
    const idempotencyKey = randomUUID();
    vi.stubEnv("COMS_API_BASE_URL", "https://api.example.test/");
    vi.stubEnv("COMS_AUTH_GATEWAY_SECRET", gatewaySecret);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: randomUUID() })));
    vi.stubGlobal("fetch", fetchMock);

    await requestComsApi("/supplier-receipts", {
      cookieHeader: null,
      method: "POST",
      body: { supplier_id: randomUUID() },
      headers: { "Idempotency-Key": idempotencyKey },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("idempotency-key")).toBe(idempotencyKey);
    expect(headers.get("x-coms-auth-gateway")).toBe(gatewaySecret);
  });
});
