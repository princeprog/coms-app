import { afterEach, describe, expect, it, vi } from "vitest";
import { authTestUser } from "@/test/auth-fixtures";

const { cookieStore, cookiesMock, headersMock } = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn((): { name: string; value: string }[] => []),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return {
    cookieStore,
    cookiesMock: vi.fn(async () => cookieStore),
    headersMock: vi.fn(
      async () => new Headers({ origin: "http://localhost:3000" }),
    ),
  };
});

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

import { loginAction, logoutAction } from "./auth-actions";

describe("auth-actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    cookieStore.getAll.mockReturnValue([]);
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("calls Nest directly and relays HttpOnly auth cookies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: { ...authTestUser, hashed_password: "must-not-leak" },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "coms_access=access; Path=/; HttpOnly; Max-Age=900",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginAction({ email: "staff@example.com", password: "secret" }),
    ).resolves.toEqual({ ok: true, data: { user: authTestUser } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/auth/login",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(
      (fetchMock.mock.calls[0]?.[1].headers as Headers).get("origin"),
    ).toBe("http://localhost:3000");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "coms_access",
      "access",
      expect.objectContaining({ httpOnly: true, maxAge: 900, path: "/" }),
    );
  });

  it("forwards only auth cookies and relays logout cookie expiration", async () => {
    cookieStore.getAll.mockReturnValue([
      { name: "coms_access", value: "access" },
      { name: "coms_refresh", value: "refresh" },
      { name: "other", value: "private" },
    ]);
    const responseHeaders = new Headers();
    responseHeaders.append(
      "set-cookie",
      "coms_access=; Path=/; HttpOnly; Max-Age=0",
    );
    responseHeaders.append(
      "set-cookie",
      "coms_refresh=; Path=/; HttpOnly; Max-Age=0",
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 204, headers: responseHeaders }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutAction()).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/auth/logout",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(
      (fetchMock.mock.calls[0]?.[1].headers as Headers).get("cookie"),
    ).toBe("coms_access=access; coms_refresh=refresh");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "coms_access",
      "",
      expect.objectContaining({ httpOnly: true, maxAge: 0, path: "/" }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "coms_refresh",
      "",
      expect.objectContaining({ httpOnly: true, maxAge: 0, path: "/" }),
    );
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(cookieStore.set).toHaveBeenCalledWith(
      "__Host-coms_refresh",
      "",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      }),
    );
  });

  it("retains cookies when logout fails so the user can retry", async () => {
    cookieStore.getAll.mockReturnValue([
      { name: "coms_refresh", value: "refresh" },
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Unavailable" }), {
          status: 503,
        }),
      ),
    );

    await expect(logoutAction()).resolves.toEqual({
      ok: false,
      status: 503,
      message: "Unavailable",
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { user: { id: "incomplete" } },
    "<html>Gateway unavailable</html>",
  ])(
    "rejects malformed login success without relaying cookies: %j",
    async (payload) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "set-cookie": "coms_access=unverified; Path=/; HttpOnly",
            },
          }),
        ),
      );
      await expect(
        loginAction({ email: "staff@example.com", password: "secret" }),
      ).resolves.toMatchObject({ ok: false, status: 502 });
      expect(cookieStore.set).not.toHaveBeenCalled();
    },
  );

  it("requires the logout contract before clearing a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("OK", { status: 200 })),
    );
    await expect(logoutAction()).resolves.toMatchObject({
      ok: false,
      status: 502,
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
