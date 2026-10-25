// Run only after the parent starts the production Next app and disposable full-App API fixture.
// This harness does not build, start servers, modify business data, or grant storage persistence.
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const fixtureFile =
  process.env.PWA_FIXTURE_FILE ||
  path.resolve(
    "../coms-api/node_modules/.cache/coms-offline-browser/fixture.json",
  );
const fixture = JSON.parse(await readFile(fixtureFile, "utf8"));
assert(
  /^coms_offline_browser_[a-f0-9]{32}$/.test(fixture.databaseName),
  "Fixture database must be disposable",
);
const origin =
  process.env.PWA_APP_URL || fixture.origin || "https://localhost:3445";
assert(
  ["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  "PWA browser verification requires the loopback disposable fixture",
);
const cashier = fixture.cashier || fixture;
assert(
  cashier.email && cashier.password,
  "Fixture must supply cashier.email/password or email/password",
);
const output = path.resolve("test-results/pwa-production");
await mkdir(output, { recursive: true });
const evidence = {
  checks: [],
  persistence: null,
  installedPrompt: false,
  simulatedPersistence: false,
};
const pageErrors = [];
const workerFile = path.resolve("public/sw.js");
let originalWorker;
async function check(name, action) {
  await action();
  evidence.checks.push(name);
  console.log(`PASS ${name}`);
}
async function until(check, message, timeout = 45000) {
  const deadline = Date.now() + timeout;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
async function workerStatus(page) {
  return page.evaluate(async () => {
    const worker = (await navigator.serviceWorker.getRegistration("/"))?.active;
    if (!worker) return { ready: false };
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => {
        channel.port1.close();
        resolve({ ready: false });
      }, 5000);
      channel.port1.onmessage = ({ data }) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(data);
      };
      worker.postMessage({ type: "COMS_PWA_STATUS" }, [channel.port2]);
    });
  });
}
const browser = await chromium.launch({
  channel: process.env.PWA_BROWSER_CHANNEL || "msedge",
  headless: true,
  args: ["--ignore-certificate-errors"],
});
try {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    serviceWorkers: "allow",
    viewport: { width: 1440, height: 900 },
  });
  context.on("page", (page) =>
    page.on("pageerror", (error) => pageErrors.push(error.message)),
  );
  await context.addInitScript(() => {
    window.addEventListener("beforeinstallprompt", () => {
      window.__pwaInstallPromptSeen = true;
    });
  });
  let page = await context.newPage();
  await page.goto(origin);
  await check("visible keyboard-operable install action", async () => {
    const install = page.getByRole("button", {
      name: "Install COMS",
      exact: true,
    });
    await install.waitFor();
    await install.focus();
    assert(
      await install.evaluate((button) => button === document.activeElement),
    );
    // Native OS installation is not automated. When the browser has no native prompt,
    // the same action must explain the browser's install command.
    evidence.installedPrompt = await page.evaluate(
      () => window.__pwaInstallPromptSeen === true,
    );
    if (!evidence.installedPrompt) {
      await page.keyboard.press("Enter");
      await page
        .getByText(/Open your browser menu and choose Install app/)
        .waitFor();
    }
  });
  await check(
    "standalone manifest and normal/maskable branded icons",
    async () => {
      const response = await context.request.get(
        `${origin}/manifest.webmanifest`,
      );
      assert.equal(response.status(), 200);
      const manifest = await response.json();
      assert.equal(manifest.display, "standalone");
      assert.equal(manifest.start_url, "/?source=pwa");
      for (const purpose of ["any", "maskable"]) {
        for (const size of [192, 512]) {
          const icon = manifest.icons.find(
            (item) =>
              item.purpose === purpose && item.sizes === `${size}x${size}`,
          );
          assert(icon, `Missing ${purpose} ${size} icon`);
          const image = await context.request.get(`${origin}${icon.src}`);
          assert.equal(image.status(), 200);
          assert.match(image.headers()["content-type"], /image\/png/);
        }
      }
    },
  );
  await check(
    "production worker reaches complete shell readiness",
    async () => {
      await until(
        async () => (await workerStatus(page)).ready,
        "Public offline shell did not finish installing",
      );
      const status = await workerStatus(page);
      assert(status.cachedAssets > 5);
      assert.equal(status.cachedAssets, status.totalAssets);
      const response = await context.request.get(`${origin}/sw.js`);
      assert.match(response.headers()["cache-control"], /no-store/);
      assert.equal(response.headers()["service-worker-allowed"], "/");
    },
  );
  await check(
    "real API fixture login and authenticated POS navigation",
    async () => {
      await page
        .getByRole("textbox", { name: "Email", exact: true })
        .fill(cashier.email);
      await page
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(cashier.password);
      await page.getByRole("button", { name: "Sign In", exact: true }).click();
      await page.waitForURL((url) => url.pathname !== "/");
      const branch =
        fixture.branchId || fixture.branch_id || fixture.branch?.id;
      await page.goto(
        `${origin}/pos${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`,
      );
      await page.getByRole("heading", { name: /^point of sale$/i }).waitFor();
      evidence.persistence = await page.evaluate(async () => ({
        persisted: await navigator.storage.persisted(),
        persistResult: await navigator.storage.persist(),
      }));
    },
  );
  await check(
    "no authenticated HTML/API/RSC or fixture identity in Cache Storage",
    async () => {
      const audit = await page.evaluate(
        async (markers) => {
          const keys = [];
          let privateHtml = false;
          for (const name of await caches.keys()) {
            const cache = await caches.open(name);
            for (const request of await cache.keys()) {
              const url = new URL(request.url);
              keys.push(url.pathname);
              const response = await cache.match(request);
              if (
                response?.headers.get("content-type")?.includes("text/html")
              ) {
                const html = await response.text();
                privateHtml ||= markers.some(
                  (marker) => marker && html.includes(marker),
                );
              }
            }
          }
          return { keys, privateHtml };
        },
        [cashier.email, cashier.password],
      );
      assert.equal(
        audit.privateHtml,
        false,
        "Cached public shell contains fixture identity",
      );
      assert(
        audit.keys.every(
          (key) =>
            key.startsWith("/_next/static/") ||
            key === "/pwa/offline-pos.html" ||
            /^\/pwa\/(?:icon|maskable)-(?:192|512)\.png$/.test(key),
        ),
        "Cache contains a path outside the public allowlist",
      );
      assert.equal(audit.keys.filter((key) => key.endsWith(".html")).length, 1);
    },
  );
  await check(
    "waiting update pauses for an unconfirmed saved sale, then applies once clear",
    async () => {
      originalWorker = await readFile(workerFile, "utf8");
      const served = await context.request.get(`${origin}/sw.js`);
      assert.equal(
        await served.text(),
        originalWorker,
        "Fixture must serve this checkout's generated worker",
      );
      // Change only the disposable local deployment's generated worker bytes. No rebuild,
      // source change, business data mutation, schema change or unconditional activation.
      await writeFile(
        workerFile,
        `${originalWorker}\n// PWA lifecycle probe ${Date.now()}\n`,
      );
      await page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistration("/")).update(),
      );
      await until(
        () =>
          page.evaluate(
            async () =>
              !!(await navigator.serviceWorker.getRegistration("/")).waiting,
          ),
        "Update did not enter waiting state",
      );
      const update = page.getByRole("button", {
        name: "Update COMS",
        exact: true,
      });
      // A saved register with an unconfirmed sale, written the way the store keeps it.
      const savedRegister = (records) =>
        page.evaluate(
          (value) =>
            new Promise((resolve, reject) => {
              const request = indexedDB.open("coms-pos-offline-v1", 1);
              request.onupgradeneeded = () =>
                request.result.createObjectStore("data");
              request.onerror = () => reject(request.error);
              request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction("data", "readwrite");
                const store = tx.objectStore("data");
                if (value) store.put(value, "scope:probe");
                else store.delete("scope:probe");
                tx.oncomplete = () => {
                  db.close();
                  resolve();
                };
                tx.onabort = () => reject(tx.error);
              };
            }),
          records && { cart: { items: [] }, records },
        );
      await savedRegister([{ status: "PENDING", envelope: { id: "probe" } }]);
      await update.focus();
      await page.keyboard.press("Enter");
      await page.getByText(/Update paused/).waitFor();
      assert(
        await page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration("/")).waiting,
        ),
        "An unconfirmed saved sale must keep the update waiting",
      );
      await savedRegister(null);
      await update.click();
      await until(
        () =>
          page.evaluate(
            async () =>
              !(await navigator.serviceWorker.getRegistration("/")).waiting,
          ),
        "Update did not apply after saved sales were cleared",
      );
    },
  );
  await context.setOffline(true);
  await check(
    "cold offline POS document hydrates from production chunks",
    async () => {
      await page.close();
      page = await context.newPage();
      await page.goto(`${origin}/pos`);
      await page
        .getByRole("heading", { name: /COMS.*Prepared register/ })
        .waitFor();
      await page
        .getByRole("heading", { name: "No prepared register available" })
        .waitFor();
      await page.getByRole("button", { name: "Install COMS" }).waitFor();
      await page.reload();
      await page
        .getByRole("heading", { name: "No prepared register available" })
        .waitFor();
      await page.screenshot({
        path: path.join(output, "offline-pos-desktop.png"),
        fullPage: true,
      });
    },
  );
  await check(
    "installed start route opens shell; unrelated pages reconnect",
    async () => {
      for (const route of ["/offline-pos", "/?source=pwa"]) {
        await page.goto(`${origin}${route}`);
        await page
          .getByRole("heading", { name: "No prepared register available" })
          .waitFor();
      }
      for (const route of ["/staff", "/dashboard", "/"]) {
        await page.goto(`${origin}${route}`);
        assert.equal(await page.title(), "Reconnect to COMS");
        await page.getByRole("link", { name: "Open offline POS" }).focus();
        await page.keyboard.press("Enter");
        await page
          .getByRole("heading", { name: "No prepared register available" })
          .waitFor();
      }
    },
  );
  await check(
    "mobile offline reflow and keyboard install guidance",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${origin}/offline-pos`);
      await page
        .getByRole("heading", { name: "No prepared register available" })
        .waitFor();
      await page.getByRole("button", { name: "Install COMS" }).focus();
      await page.keyboard.press("Enter");
      await page
        .getByText(/Open your browser menu and choose Install app/)
        .waitFor();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(output, "offline-pos-mobile.png"),
        fullPage: true,
      });
    },
  );
  await check("no production page errors", async () => {
    assert.deepEqual(pageErrors, []);
  });
  await context.close();
} finally {
  if (originalWorker !== undefined) await writeFile(workerFile, originalWorker);
  await writeFile(
    path.join(output, "verification.json"),
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}
