import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { requestApi, requestApiRaw } from "./api-services";

describe("api-services", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("passes a ten-second abort deadline without retrying requests", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = vi
      .fn()
      .mockRejectedValue(new DOMException("Timeout", "TimeoutError"));
    vi.stubGlobal("fetch", fetch);
    await expect(
      requestApiRaw("/auth/refresh", { method: "POST" }),
    ).rejects.toMatchObject({ status: 503 });
    expect(timeout).toHaveBeenCalledWith(10000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects redirects without forwarding credentials or repeating a POST", async () => {
    const requests: string[] = [];
    const server = createServer((req, res) => {
      requests.push(req.url!);
      if (req.url === "/auth/refresh") {
        res.writeHead(307, { location: "/unexpected-target" });
        res.end();
      } else {
        res.end("unexpected redirect");
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    try {
      const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      await expect(
        requestApiRaw("/auth/refresh", {
          baseUrl,
          method: "POST",
          cookie: "coms_refresh=test",
          headers: { "X-COMS-Auth-Gateway": "test-gateway" },
        }),
      ).rejects.toMatchObject({ status: 503 });
      expect(requests).toEqual(["/auth/refresh"]);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("reports invalid successful JSON as a gateway failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>Unavailable</html>", { status: 200 }),
        ),
    );
    await expect(requestApi("/auth/me")).rejects.toMatchObject({ status: 502 });
  });
});
