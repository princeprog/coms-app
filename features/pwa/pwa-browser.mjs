// Real Chromium/Workbox integration, isolated from the shared Next build and API.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { injectManifest } from "workbox-build";
import { chromium } from "playwright";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const temp = await mkdtemp(path.join(tmpdir(), "coms-pwa-browser-"));
const requests = [];
let worker;
const pageJs = (
  await build({
    stdin: {
      contents: `import { registerPwa, workerRequest, getPwaOfflineStatus, respondToUpdateSafety } from './features/pwa/services/registration';
import { registerPwaUpdateSafetyCheck } from './features/pwa/services/update-safety';
navigator.serviceWorker.addEventListener('message', respondToUpdateSafety);
window.getPwaOfflineStatus = getPwaOfflineStatus;
window.applyPwaUpdate = async () => workerRequest((await navigator.serviceWorker.getRegistration('/')).waiting, 'COMS_PWA_APPLY_UPDATE');
window.connectSafety = () => {
  registerPwaUpdateSafetyCheck('cart', () => window.cartEmpty === true);
  registerPwaUpdateSafetyCheck('outbox', async () => window.outboxEmpty === true);
};
window.registrationPromise = registerPwa();
document.querySelector('button').onclick = () => document.querySelector('output').textContent = 'Hydrated offline';`,
      resolveDir: root,
    },
    bundle: true,
    write: false,
    format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
  })
).outputFiles[0].text;
const shell =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/_next/static/test.css"></head><body><h1>Offline POS shell</h1><button>Check hydration</button><output></output><script src="/_next/static/test.js"></script></body></html>';
const online = shell.replace(
  "Offline POS shell",
  "PRIVATE AUTHENTICATED FIXTURE",
);
const server = createServer((req, res) => {
  requests.push({ url: req.url, cookie: req.headers.cookie });
  const url = new URL(req.url, "http://localhost");
  const headers = { "Cache-Control": "no-store" };
  let body = online;
  let type = "text/html";
  if (url.pathname === "/sw.js") {
    body = worker;
    type = "application/javascript";
  } else if (url.pathname === "/_next/static/test.js") {
    body = pageJs;
    type = "application/javascript";
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (url.pathname === "/_next/static/test.css") {
    body = "body { color: rgb(23, 23, 23); }";
    type = "text/css";
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (url.pathname === "/pwa/offline-pos.html") {
    body = shell;
    headers["Cache-Control"] = "public, max-age=0";
  } else if (url.pathname.startsWith("/api/")) {
    body = '{"private":"API SECRET"}';
    type = "application/json";
  } else if (req.headers.rsc) {
    body = "PRIVATE RSC PAYLOAD";
    type = "text/x-component";
  } else if (url.pathname === "/silent") {
    body = "<!doctype html><title>Unresponsive COMS window</title>";
  }
  res.writeHead(200, { ...headers, "Content-Type": type });
  res.end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function until(check) {
  const deadline = Date.now() + 10000;
  while (!(await check())) {
    if (Date.now() > deadline)
      throw new Error("Timed out waiting for worker lifecycle");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
async function buildWorker(revision) {
  const swSrc = path.join(temp, "source.js");
  const swDest = path.join(temp, "sw.js");
  await build({
    entryPoints: [path.join(root, "features/pwa/service-worker.mjs")],
    outfile: swSrc,
    bundle: true,
    format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  await injectManifest({
    swSrc,
    swDest,
    globDirectory: temp,
    globPatterns: [],
    additionalManifestEntries: [
      "/_next/static/test.js",
      "/_next/static/test.css",
      "/pwa/offline-pos.html",
    ].map((url) => ({
      url,
      revision,
      integrity: `sha256-${createHash("sha256")
        .update(
          url.endsWith(".js")
            ? pageJs
            : url.endsWith(".css")
              ? "body { color: rgb(23, 23, 23); }"
              : shell,
        )
        .digest("base64")}`,
    })),
  });
  worker = await readFile(swDest, "utf8");
}
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PWA_BROWSER_CHANNEL || "msedge",
});
try {
  await buildWorker("one");
  const context = await browser.newContext({ serviceWorkers: "allow" });
  await context.addCookies([
    { name: "session", value: "PRIVATE-COOKIE", url: base },
  ]);
  const page = await context.newPage();
  await page.goto(base);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  let status = await page.evaluate(() => window.getPwaOfflineStatus());
  assert.deepEqual(status, { ready: true, cachedAssets: 3, totalAssets: 3 });
  for (const url of [
    "/_next/static/test.js",
    "/_next/static/test.css",
    "/pwa/offline-pos.html",
  ]) {
    assert(
      requests.some((req) => req.url === url && !req.cookie),
      `precache download must omit cookies: ${url}`,
    );
  }
  await page.evaluate(async () => {
    await fetch("/api/auth/me");
    await fetch("/pos?_rsc=secret", { headers: { RSC: "1" } });
    await fetch("/pos", {
      method: "POST",
      headers: { "Next-Action": "secret" },
      body: "PRIVATE ACTION",
    });
  });
  const keys = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((req) => req.url),
        ),
      )
    ).flat(),
  );
  assert.equal(keys.length, 3);
  assert(
    keys.every((url) =>
      /\/(?:_next\/static\/test\.(?:js|css)|pwa\/offline-pos\.html)\?/.test(
        url,
      ),
    ),
  );
  await context.setOffline(true);
  for (const route of ["/pos?branch=42", "/offline-pos", "/?source=pwa"]) {
    await page.goto(`${base}${route}`);
    assert.equal(await page.locator("h1").textContent(), "Offline POS shell");
    await page.getByRole("button", { name: "Check hydration" }).click();
    assert.equal(
      await page.locator("output").textContent(),
      "Hydrated offline",
    );
    assert.equal(
      await page.locator("body").evaluate((el) => getComputedStyle(el).color),
      "rgb(23, 23, 23)",
    );
  }
  for (const route of ["/staff", "/dashboard", "/"]) {
    await page.goto(`${base}${route}`);
    assert.equal(await page.title(), "Reconnect to COMS");
    assert.equal(
      await page
        .locator("body")
        .textContent()
        .then((value) => value.includes("PRIVATE")),
      false,
    );
  }
  await context.setOffline(false);
  await page.goto(base);
  await page.waitForFunction(() => typeof window.applyPwaUpdate === "function");
  await page.evaluate(() => window.registrationPromise.then(() => true));
  await buildWorker("two");
  await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration("/")).update(),
  );
  await until(() =>
    page.evaluate(
      async () =>
        !!(await navigator.serviceWorker.getRegistration("/")).waiting,
    ),
  );
  assert.deepEqual(
    await page.evaluate(() => window.applyPwaUpdate()),
    { applied: false },
    "missing owners must block",
  );
  await page.evaluate(() => {
    window.connectSafety();
    window.cartEmpty = false;
    window.outboxEmpty = true;
  });
  assert.deepEqual(
    await page.evaluate(() => window.applyPwaUpdate()),
    { applied: false },
    "cart must block",
  );
  await page.evaluate(() => {
    window.cartEmpty = true;
    window.outboxEmpty = false;
  });
  assert.deepEqual(
    await page.evaluate(() => window.applyPwaUpdate()),
    { applied: false },
    "pending outbox must block",
  );
  await page.evaluate(() => {
    window.outboxEmpty = true;
  });
  const second = await context.newPage();
  await second.goto(base);
  assert.deepEqual(
    await page.evaluate(() => window.applyPwaUpdate()),
    { applied: false },
    "other windows must also approve",
  );
  await second.goto(`${base}/silent`);
  assert.deepEqual(
    await page.evaluate(() => window.applyPwaUpdate()),
    { applied: false },
    "a window that cannot answer must block activation",
  );
  await second.close();
  assert.deepEqual(await page.evaluate(() => window.applyPwaUpdate()), {
    applied: true,
  });
  await until(() =>
    page.evaluate(
      async () => !(await navigator.serviceWorker.getRegistration("/")).waiting,
    ),
  );
  assert.equal(
    await page.locator("h1").textContent(),
    "PRIVATE AUTHENTICATED FIXTURE",
    "activation must not force reload",
  );
  await page.evaluate(async () => {
    const cache = await caches.open("coms-public-pwa-v1");
    const key = (await cache.keys()).find((req) =>
      req.url.includes("test.css"),
    );
    await cache.delete(key);
  });
  status = await page.evaluate(() => window.getPwaOfflineStatus());
  assert.equal(
    status.ready,
    false,
    "readiness must detect evicted hydration assets",
  );
  console.log(
    "PWA browser PASS: cookie-free install, strict cache contents, offline JS/CSS hydration, scoped navigation fallback, default/cart/outbox/multi-window update blocking, explicit activation, eviction readiness.",
  );
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}
