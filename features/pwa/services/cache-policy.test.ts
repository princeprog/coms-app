import { describe, expect, it } from "vitest";
import {
  cacheableRequest,
  offlinePosNavigation,
  publicResponse,
} from "./cache-policy.mjs";

const origin = "https://coms.example";
const assets = new Set([
  `${origin}/_next/static/chunks/app.js`,
  `${origin}/pwa/offline-pos.html`,
]);
const request = (path: string, init?: RequestInit) =>
  new Request(`${origin}${path}`, init);

describe("public-only precache boundary", () => {
  it("serves only exact precached public assets", () => {
    expect(
      cacheableRequest(request("/_next/static/chunks/app.js"), origin, assets),
    ).toBe(true);
    for (const path of [
      "/pos",
      "/offline-pos",
      "/api/auth/me",
      "/api/exports/sales",
      "/_next/data/id/pos.json",
      "/_next/static/chunks/unknown.js",
      "/_next/static/chunks/app.js?_rsc=private",
      "/_next/static/chunks/app.js?token=private",
    ]) {
      expect(cacheableRequest(request(path), origin, assets), path).toBe(false);
    }
    expect(
      cacheableRequest(
        new Request("https://foreign.example/_next/static/chunks/app.js"),
        origin,
        assets,
      ),
    ).toBe(false);
  });

  it("never intercepts server actions, authenticated fetches or RSC", () => {
    for (const init of [
      { method: "POST" },
      { headers: { RSC: "1" } },
      { headers: { "Next-Action": "action" } },
      { headers: { "Next-Router-State-Tree": "private" } },
      { headers: { Authorization: "Bearer private" } },
      { headers: { Accept: "text/x-component" } },
    ] as RequestInit[]) {
      expect(
        cacheableRequest(
          request("/_next/static/chunks/app.js", init),
          origin,
          assets,
        ),
      ).toBe(false);
    }
  });

  it("limits the offline POS fallback to POS and the installed start URL", () => {
    for (const path of [
      "/pos",
      "/pos?branch=42",
      "/offline-pos",
      "/?source=pwa",
    ]) {
      expect(offlinePosNavigation(new URL(path, origin)), path).toBe(true);
    }
    for (const path of [
      "/",
      "/dashboard",
      "/pos/history",
      "/api/pos",
      "/?source=other",
      "/?source=pwa&next=/staff",
    ]) {
      expect(offlinePosNavigation(new URL(path, origin)), path).toBe(false);
    }
  });

  it("refuses redirects, private responses, credentials and unexpected content types", () => {
    const url = new URL("/_next/static/chunks/app.js", origin);
    expect(
      publicResponse(
        url,
        new Response("code", {
          headers: { "Content-Type": "application/javascript" },
        }),
      ),
    ).toBe(true);
    for (const headers of [
      { "Content-Type": "text/html" },
      { "Content-Type": "application/javascript", "Cache-Control": "private" },
      { "Content-Type": "application/javascript", "Cache-Control": "no-store" },
      {
        "Content-Type": "application/javascript",
        "Set-Cookie": "session=private",
      },
    ] as HeadersInit[])
      expect(publicResponse(url, new Response("secret", { headers }))).toBe(
        false,
      );
    expect(publicResponse(url, Response.redirect(`${origin}/login`))).toBe(
      false,
    );
  });
});
