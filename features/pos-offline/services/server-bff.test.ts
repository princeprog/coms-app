import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleOfflineRequest } from "./server-bff";
import { offlineTarget } from "./server-target";
vi.mock("server-only", () => ({}));
const branch = "00000000-0000-4000-8000-000000000001";
const session = "00000000-0000-4000-8000-000000000002";
const device = "00000000-0000-4000-8000-000000000003";
const path = ["branches", branch, "sessions", session, "finalize"];
const fetchMock = vi.fn();
function request(
  body: unknown = { device_id: device, final_sequence: 1 },
  headers: Record<string, string> = {},
  method = "POST",
) {
  return new Request(`https://coms.test/api/pos-offline/${path.join("/")}`, {
    method,
    headers: {
      origin: "https://coms.test",
      "sec-fetch-site": "same-origin",
      cookie: "theme=dark; coms_access=access; coms_refresh=refresh",
      "content-type": "application/json",
      ...headers,
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("COMS_API_BASE_URL", "https://backend.test");
  vi.stubGlobal(
    "fetch",
    fetchMock.mockReset().mockResolvedValue(Response.json({ ok: true })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("offline POS BFF", () => {
  it("forwards only access cookie through gateway and drains even when frontend flag is off", async () => {
    vi.stubEnv("COMS_OFFLINE_POS_ENABLED", "false");
    const response = await handleOfflineRequest(request(), path);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://backend.test/pos-offline/${path.join("/")}`);
    expect(init.headers.get("cookie")).toBe("coms_access=access");
    expect(init.headers.get("x-coms-auth-gateway")).toBeTruthy();
    expect(init.redirect).toBe("error");
    expect(init.cache).toBe("no-store");
  });
  it.each<Record<string, string>>([
    { origin: "https://evil.test" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
  ])("rejects cross-origin mutations before forwarding %j", async (headers) => {
    expect(
      (await handleOfflineRequest(request(undefined, headers), path)).status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("accepts same-site requests behind a TLS proxy and rejects other hosts", async () => {
    const proxied = (origin: string) =>
      new Request("http://localhost:3445/api/pos-offline/x", {
        method: "POST",
        body: JSON.stringify({ device_id: device, final_sequence: 1 }),
        headers: {
          origin,
          host: "localhost:3445",
          "sec-fetch-site": "same-origin",
          cookie: "coms_access=access",
          "content-type": "application/json",
        },
      });
    expect(
      (await handleOfflineRequest(proxied("https://localhost:3445"), path))
        .status,
    ).toBe(200);
    expect(
      (await handleOfflineRequest(proxied("https://evil.test"), path)).status,
    ).toBe(403);
  });
  it("requires a session without redirecting away from the cached shell", async () => {
    const response = await handleOfflineRequest(
      request(undefined, { cookie: "coms_refresh=refresh" }),
      path,
    );
    expect(response.status).toBe(401);
    expect(response.headers.has("location")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    [{ "content-type": "text/plain" }, 415],
    [{ "content-length": "1048577" }, 413],
  ] as const)(
    "enforces JSON media type and bounded bodies",
    async (headers, status) => {
      expect(
        (await handleOfflineRequest(request(undefined, headers), path)).status,
      ).toBe(status);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it("rejects body fields outside the documented operation", async () => {
    expect(
      (
        await handleOfflineRequest(
          request({
            device_id: device,
            final_sequence: 1,
            url: "http://internal",
          }),
          path,
        )
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("validates context without forwarding credential fields", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        user_id: branch,
        enabled: false,
        token: "should-not-leave",
      }),
    );
    const response = await handleOfflineRequest(request(undefined, {}, "GET"), [
      "context",
    ]);
    expect(await response.json()).toEqual({ user_id: branch, enabled: false });
  });
  it.each<[string[]]>([
    [["https:", "evil.test"]],
    [["branches", "..", "devices"]],
    [["sessions", session, "sync"]],
    [["branches", branch, "sessions", session, "delete"]],
  ])("does not allow arbitrary targets %j", (target) => {
    expect(offlineTarget("POST", target, new URLSearchParams())).toBeNull();
  });
  it("requires complete nonempty recovery evidence and reason", () => {
    const target = offlineTarget(
      "POST",
      ["branches", branch, "sessions", session, "recover-finalize"],
      new URLSearchParams(),
    )!;
    expect(
      target.schema!.safeParse({
        device_id: device,
        final_sequence: 0,
        transaction_ids: [],
        reason: "Recover device",
      }).success,
    ).toBe(false);
    expect(
      target.schema!.safeParse({
        device_id: device,
        final_sequence: 2,
        transaction_ids: [session],
        reason: "Recover device",
      }).success,
    ).toBe(false);
    expect(
      target.schema!.safeParse({
        device_id: device,
        final_sequence: 1,
        transaction_ids: [session],
        reason: "Recover device",
      }).success,
    ).toBe(true);
  });
});
