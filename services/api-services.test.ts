import { afterEach, describe, expect, it, vi } from "vitest";

import { requestApi, requestApiRaw } from "./api-services";

describe("api-services", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends JSON, selected cookies, and no-store requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      requestApi<{ ok: boolean }>("/auth/me", {
        baseUrl: "http://localhost:3001",
        method: "POST",
        body: { hello: "world" },
        cookie: "coms_access=token",
      }),
    ).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/auth/me");
    expect(init.cache).toBe("no-store");
    expect((init.headers as Headers).get("cookie")).toBe("coms_access=token");
    expect(init.body).toBe(JSON.stringify({ hello: "world" }));
  });

  it("normalizes HTTP and network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "Nope" }), { status: 401 }),
        ),
    );
    await expect(requestApi("/auth/me")).rejects.toMatchObject({
      status: 401,
      message: "Nope",
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private URL")));
    await expect(requestApiRaw("/auth/me")).rejects.toMatchObject({
      status: 503,
    });
    await expect(requestApiRaw("/auth/me")).rejects.not.toThrow("private URL");
  });
});
