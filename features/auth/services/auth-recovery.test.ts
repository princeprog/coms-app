import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { authTestMeResponse, authTestSessionUser } from "@/test/auth-fixtures";
const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  set: vi.fn(),
  origin: "http://localhost:3000",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...state.cookies].map(([name, value]) => ({ name, value })),
    set: state.set,
  }),
  headers: async () =>
    new Headers({
      origin: state.origin,
      "X-COMS-Auth-Gateway": "browser-forgery",
    }),
}));
import { currentUserAction, loginAction, logoutAction } from "./auth-actions";

const user = authTestSessionUser;
const json = (value: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(value), { status, headers });
describe("server session recovery", () => {
  beforeEach(() => {
    state.cookies.clear();
    state.set
      .mockReset()
      .mockImplementation((name, value) => state.cookies.set(name, value));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("rechecks me first and avoids a needless rotation", async () => {
    const fetch = vi.fn().mockResolvedValue(json(authTestMeResponse));
    vi.stubGlobal("fetch", fetch);
    expect(await currentUserAction()).toEqual({ ok: true, data: user });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain("/auth/me");
    expect(fetch.mock.calls[0][1].headers.get("X-COMS-Auth-Gateway")).toBe(
      process.env.COMS_AUTH_GATEWAY_SECRET,
    );
  });
  it("refreshes once and retries me using the replaced cookie", async () => {
    state.cookies.set("coms_refresh", "old");
    const headers = new Headers();
    headers.append(
      "set-cookie",
      "coms_access=new-access; HttpOnly; SameSite=Lax; Path=/",
    );
    headers.append(
      "set-cookie",
      "coms_refresh=new-refresh; HttpOnly; SameSite=Lax; Path=/",
    );
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(
        json({ user: authTestMeResponse.user }, 200, headers),
      )
      .mockResolvedValueOnce(json(authTestMeResponse));
    vi.stubGlobal("fetch", fetch);
    expect(await currentUserAction()).toEqual({ ok: true, data: user });
    expect(fetch.mock.calls.map((call) => call[0].split("/").pop())).toEqual([
      "me",
      "refresh",
      "me",
    ]);
    expect(fetch.mock.calls[2][1].headers.get("cookie")).toBe(
      "coms_access=new-access",
    );
    expect(state.cookies.get("coms_refresh")).toBe("new-refresh");
  });
  it("does not refresh without cookies or Web Locks support", async () => {
    const fetch = vi.fn().mockResolvedValue(json({}, 401));
    vi.stubGlobal("fetch", fetch);
    expect(await currentUserAction()).toEqual({ ok: true, data: null });
    state.cookies.set("coms_refresh", "present");
    expect(await currentUserAction(false)).toMatchObject({
      ok: false,
      status: 428,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("clears rejected sessions using actual production cookie serialization", async () => {
    state.cookies.set("__Host-coms_refresh", "expired");
    const responseHeaders = new Headers();
    const serialized = new ResponseCookies(responseHeaders);
    state.set.mockImplementation((name, value, options) =>
      serialized.set(name, value, options),
    );
    const fetch = vi.fn().mockResolvedValue(json({}, 401));
    vi.stubGlobal("fetch", fetch);
    expect(await currentUserAction()).toEqual({ ok: true, data: null });
    expect(fetch).toHaveBeenCalledTimes(2);
    const cleared = responseHeaders
      .getSetCookie()
      .filter((cookie) => cookie.startsWith("__Host-"));
    expect(cleared).toHaveLength(2);
    for (const cookie of cleared) {
      expect(cookie).toMatch(/=;/);
      expect(cookie).toContain("Max-Age=0");
      expect(cookie).toContain("Expires=Thu, 01 Jan 1970");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=lax");
    }
  });
  it("retains session on outage, never retries the refresh POST", async () => {
    state.cookies.set("coms_refresh", "existing");
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({}, 401))
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetch);
    expect(await currentUserAction()).toMatchObject({ ok: false, status: 503 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(state.set).not.toHaveBeenCalled();
  });
  it("preserves accurate rate-limit retry delays", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ message: "Too many" }, 429, { "Retry-After": "17" }),
        ),
    );
    expect(
      await loginAction({ email: "test@example.com", password: "test" }),
    ).toMatchObject({ ok: false, status: 429, retryAfterSeconds: 17 });
  });
  it("expires secure cookies on successful logout without a bare deletion overwrite", async () => {
    const headers = new Headers();
    const serialized = new ResponseCookies(headers);
    state.set.mockImplementation((name, value, options) =>
      serialized.set(name, value, options),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    expect(await logoutAction()).toMatchObject({ ok: true });
    expect(
      headers
        .getSetCookie()
        .filter((cookie) => cookie.startsWith("__Host-"))
        .every(
          (cookie) => cookie.includes("Secure") && cookie.includes("Max-Age=0"),
        ),
    ).toBe(true);
  });
});
