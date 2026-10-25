import { PrecacheController } from "workbox-precaching";
import {
  cacheableRequest,
  isDataRequest,
  offlinePosNavigation,
  publicResponse,
} from "./services/cache-policy.mjs";

const shellUrl = "/pwa/offline-pos.html";
const precache = new PrecacheController({
  cacheName: "coms-public-pwa-v1",
  plugins: [
    {
      requestWillFetch: async ({ request }) =>
        new Request(request, { credentials: "omit", redirect: "error" }),
      cacheWillUpdate: async ({ request, response }) =>
        publicResponse(new URL(request.url), response) ? response : null,
    },
  ],
});
precache.addToCacheList(self.__WB_MANIFEST);
const assets = new Set(precache.getURLsToCacheKeys().keys());

self.addEventListener("install", (event) => {
  event.waitUntil(precache.install(event));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await precache.activate(event);
      await self.clients.claim();
    })(),
  );
});

function reconnect() {
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reconnect to COMS</title><body><main><h1>You're offline</h1><p>Reconnect to open this page.</p><p><a href="">Try again</a></p><p><a href="/offline-pos">Open offline POS</a></p></main></body></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      },
    },
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isDataRequest(request)) return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: "no-store" });
        } catch {
          if (offlinePosNavigation(url))
            return (await precache.matchPrecache(shellUrl)) || reconnect();
          return reconnect();
        }
      })(),
    );
  } else if (cacheableRequest(request, self.location.origin, assets)) {
    // Never populate at runtime. A cache miss uses the network without writing.
    event.respondWith(
      (async () =>
        (await precache.matchPrecache(url.href)) || fetch(request))(),
    );
  }
});

async function status() {
  const entries = [...precache.getURLsToCacheKeys().keys()];
  const present = await Promise.all(
    entries.map((url) => precache.matchPrecache(url)),
  );
  const cachedAssets = present.filter(Boolean).length;
  return {
    type: "COMS_PWA_STATUS",
    ready: entries.length > 0 && cachedAssets === entries.length,
    cachedAssets,
    totalAssets: entries.length,
  };
}

function askSafety(client) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (safe) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(safe);
    };
    const timer = setTimeout(() => finish(false), 4000);
    channel.port1.onmessage = (event) => finish(event.data?.safe === true);
    try {
      client.postMessage({ type: "COMS_PWA_CHECK_UPDATE_SAFETY" }, [
        channel.port2,
      ]);
    } catch {
      finish(false);
    }
  });
}

let applying = false;
self.addEventListener("message", (event) => {
  const port = event.ports[0];
  if (!port || !event.source?.id) return;
  if (event.data?.type === "COMS_PWA_STATUS") {
    event.waitUntil(status().then((value) => port.postMessage(value)));
  } else if (event.data?.type === "COMS_PWA_APPLY_UPDATE") {
    event.waitUntil(
      (async () => {
        if (applying) {
          port.postMessage({ applied: false });
          return;
        }
        applying = true;
        try {
          const windows = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });
          const approvals = await Promise.all(windows.map(askSafety));
          const current = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });
          const sameWindows =
            current.length === windows.length &&
            current.every((client) =>
              windows.some((before) => before.id === client.id),
            );
          const applied =
            windows.length > 0 &&
            sameWindows &&
            approvals.every((safe) => safe === true);
          if (applied) await self.skipWaiting();
          port.postMessage({ applied });
        } finally {
          applying = false;
        }
      })(),
    );
  }
});
