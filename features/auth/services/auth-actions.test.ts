import { afterEach, describe, expect, it, vi } from "vitest";

const { cookieStore, cookiesMock, headersMock } = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => []),
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

import { loginAction } from "./auth-actions";

describe("auth-actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cookieStore.getAll.mockReturnValue([]);
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("calls Nest directly and relays HttpOnly auth cookies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "u1" } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "coms_access=access; Path=/; HttpOnly; Max-Age=900",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginAction({ email: "staff@example.com", password: "secret" }),
    ).resolves.toEqual({ ok: true, data: { user: { id: "u1" } } });

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
});
