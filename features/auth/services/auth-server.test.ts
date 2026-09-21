import { afterEach, describe, expect, it, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import { getCurrentUserFromServer } from "./auth-server";

describe("getCurrentUserFromServer", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the verified user and forwards the request cookie", async () => {
    cookiesMock.mockResolvedValue({
      toString: () => "coms_access=abc; coms_refresh=def; unrelated=secret",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ user: { id: "u1" } }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUserFromServer()).resolves.toEqual({
      status: "authenticated",
      user: { id: "u1" },
    });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      headers: expect.any(Headers),
    });
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toBeInstanceOf(
      Headers,
    );
    expect(
      ((fetchMock.mock.calls[0][1] as RequestInit).headers as Headers).get(
        "cookie",
      ),
    ).toBe("coms_access=abc");
  });

  it("distinguishes an expired session from an unavailable API", async () => {
    cookiesMock.mockResolvedValue({ toString: () => "" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(getCurrentUserFromServer()).resolves.toEqual({
      status: "unauthenticated",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    await expect(getCurrentUserFromServer()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("returns a recovery state when only the access token is expired", async () => {
    cookiesMock.mockResolvedValue({
      toString: () => "coms_access=expired; coms_refresh=valid",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(getCurrentUserFromServer()).resolves.toEqual({
      status: "recovering",
    });
  });
});
