// Production UI regression against the loopback-only fake API. Never uses a real account.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { chromium } = require("playwright");
const {
  createOperationalApiFixture,
} = require("./operational-api-fixture.cjs");

const root = path.resolve(__dirname, "..");
const seed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures", "operational-api.json")),
);
const outputDirectory = path.join(root, "test-results", "operational-ui");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
// 195 CSS pixels approximates the reflow width available at 200% zoom from 390px.
const viewportWidths = [195, 390, 768, 1440, 1920];
const browserErrors = [];
const failedResponses = [];
let fixture;
let server;
let browser;
let page;
let serverOutput = "";

function getFreePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close((error) =>
        error ? reject(error) : resolve(address.port),
      );
    });
  });
}

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Next.js exited before ready.\n${serverOutput}`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Next.js did not become ready.\n${serverOutput}`);
}

async function navigate(pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, {
    waitUntil: "domcontentloaded",
  });
  assert(response, `No document response for ${pathname}`);
  assert(response.status() < 500, `${pathname} returned ${response.status()}`);
  await page.locator("main").waitFor();
  await page.locator("h1").waitFor();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

async function assertPageStructure(pathname, width, expectedDeviceScale = 1) {
  const structure = await page.evaluate(() => {
    const uncontainedOverflowers = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        let ancestor = element.parentElement;
        let contained = false;
        while (ancestor && ancestor !== document.body) {
          if (getComputedStyle(ancestor).overflowX !== "visible") {
            contained = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        return {
          tag: element.tagName.toLowerCase(),
          slot: element.getAttribute("data-slot"),
          right: Math.round(rect.right),
          text: element.textContent?.trim().slice(0, 40),
          contained,
        };
      })
      .filter(
        (element) =>
          !element.contained && element.right > window.innerWidth + 1,
      )
      .slice(0, 5);

    return {
      mainCount: document.querySelectorAll("main").length,
      h1Count: document.querySelectorAll("h1").length,
      viewportWidth: window.innerWidth,
      deviceScale: window.devicePixelRatio,
      documentWidth: document.documentElement.scrollWidth,
      uncontainedOverflowers,
    };
  });
  assert.equal(
    structure.mainCount,
    1,
    `${pathname} should expose one main landmark`,
  );
  assert.equal(structure.h1Count, 1, `${pathname} should expose one page h1`);
  assert.equal(
    structure.viewportWidth,
    width,
    `${pathname} should use a ${width}px CSS viewport`,
  );
  assert.equal(
    structure.deviceScale,
    expectedDeviceScale,
    `${pathname} should use ${expectedDeviceScale}x device scale`,
  );
  assert(
    structure.documentWidth <= width,
    `${pathname} overflows at ${width}px (${structure.documentWidth}px document): ${JSON.stringify(structure.uncontainedOverflowers)}`,
  );
}

async function assertShellIdentity() {
  const identity = await page.evaluate(() => ({
    sameDocument: window.__comsShellIdentity?.document === document,
    sameSidebar:
      window.__comsShellIdentity?.sidebar ===
      document.querySelector('[data-slot="sidebar"]'),
  }));
  assert.equal(
    identity.sameDocument,
    true,
    "internal navigation replaced the document",
  );
  assert.equal(
    identity.sameSidebar,
    true,
    "internal navigation remounted the sidebar",
  );
}

async function rememberShellIdentity() {
  await page.evaluate(() => {
    window.__comsShellIdentity = {
      document,
      sidebar: document.querySelector('[data-slot="sidebar"]'),
    };
  });
}

async function saveScreenshot(name, scale = "css") {
  await page.screenshot({
    path: path.join(outputDirectory, name),
    fullPage: true,
    animations: "disabled",
    scale,
  });
}

let baseUrl;

(async () => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fixture = await createOperationalApiFixture({ gatewaySecret });
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "-p",
      String(port),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        COMS_API_BASE_URL: fixture.baseUrl,
        COMS_AUTH_GATEWAY_SECRET: gatewaySecret,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  server.stdout.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-8_000);
  });
  server.stderr.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-8_000);
  });
  await waitForServer(baseUrl, server);

  const fixtureState = await fetch(`${fixture.baseUrl}/__fixture/state`).then(
    (response) => response.json(),
  );
  const branchId = fixtureState.staff[0].branch_ids[0];
  const draftReport = fixtureState.dailyReports.find(
    (report) => report.status === "DRAFT",
  );
  assert(
    branchId && draftReport,
    "Fixture requires an assigned branch and draft report",
  );
  const routes = [
    "/roles",
    "/staff",
    "/branches",
    "/suppliers",
    "/stock-items",
    "/products",
    "/recipes",
    `/recipes/${fixtureState.products[0].id}`,
    `/branch-products?branch_id=${branchId}`,
    `/inventory?scope=BRANCH&branch_id=${branchId}`,
    "/receipts",
    `/receipts/${fixtureState.receipts[0].id}`,
    "/replenishment",
    `/replenishment/${fixtureState.stockRequests[0].id}`,
    "/dispatches",
    `/dispatches/${fixtureState.dispatches[0].id}`,
    `/pos?branch_id=${branchId}`,
    `/pos?branch_id=${branchId}&sale_id=${fixtureState.sales[0].id}`,
    `/reports?branch_id=${branchId}&status=all`,
    `/reports?branch_id=${branchId}&report_id=${draftReport.id}`,
  ];

  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(
        `${message.text()} (${message.location().url || "browser"})`,
      );
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push({ status: response.status(), url: response.url() });
    }
  });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("button", { name: /Test Operations Admin/ }).waitFor();
  await assertPageStructure("/dashboard", 1440);
  await saveScreenshot("dashboard-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await saveScreenshot("dashboard-mobile.png");
  await page.setViewportSize({ width: 1440, height: 960 });
  await rememberShellIdentity();
  for (const [label, href] of [
    ["Receiving", "/receipts"],
    ["Roles", "/roles"],
    ["Inventory", "/inventory"],
  ]) {
    await page.getByRole("link", { name: label, exact: true }).first().click();
    await page.waitForURL(`**${href}**`);
    await page.getByRole("main").waitFor();
    await assertShellIdentity();
  }
  await page.goBack();
  await page.getByRole("main").waitFor();
  await assertShellIdentity();
  await page.goForward();
  await page.getByRole("main").waitFor();
  await assertShellIdentity();

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of routes) {
      await navigate(route);
      await assertPageStructure(route, width);
      if (width === 1440 && route === "/roles") {
        await saveScreenshot("roles-desktop.png");
      }
      if (width === 390 && route === "/pos?branch_id=" + branchId) {
        await saveScreenshot("pos-mobile.png");
      }
      if (
        width === 1440 &&
        route === `/reports?branch_id=${branchId}&report_id=${draftReport.id}`
      ) {
        await saveScreenshot("daily-report-desktop.png");
      }
    }
    console.log(`PASS ${routes.length} route states at ${width}px`);
  }

  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await navigate(route);
    await assertPageStructure(`${route} dark`, 390);
    if (route === "/roles") await saveScreenshot("roles-dark-mobile.png");
  }
  console.log(`PASS ${routes.length} operational route states in dark mode`);
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );

  const zoomEmulation = await context.newCDPSession(page);
  await zoomEmulation.send("Emulation.setDeviceMetricsOverride", {
    width: 195,
    height: 422,
    deviceScaleFactor: 2,
    mobile: false,
  });
  for (const route of routes) {
    await navigate(route);
    await assertPageStructure(`${route} at 2x scale`, 195, 2);
    if (route === "/roles")
      await saveScreenshot("roles-2x-scale-mobile.png", "device");
  }
  console.log(
    `PASS ${routes.length} operational route states at 2x scale and 195 CSS pixels`,
  );
  await zoomEmulation.send("Emulation.clearDeviceMetricsOverride");
  await zoomEmulation.detach();

  await page.setViewportSize({ width: 390, height: 844 });
  await navigate("/roles");
  const createRole = page.getByRole("button", { name: /Create role/ });
  await createRole.click();
  await page.getByRole("dialog").waitFor();
  await saveScreenshot("role-create-sheet-mobile.png");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await createRole.waitFor({ state: "visible" });
  assert.equal(
    await createRole.evaluate((element) => element === document.activeElement),
    true,
  );

  await navigate(`/reports?branch_id=${branchId}&status=all`);
  const createReport = page.getByRole("button", {
    name: "Create report",
    exact: true,
  });
  await createReport.click();
  await page.getByRole("dialog").waitFor();
  await saveScreenshot("daily-report-create-dialog-mobile.png");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });

  await navigate(`/reports?branch_id=${branchId}&report_id=${draftReport.id}`);
  await saveScreenshot("daily-report-counts-mobile.png");
  await rememberShellIdentity();
  const physicalCounts = page.getByRole("textbox", {
    name: /Physical closing for/,
  });
  assert.equal(
    await physicalCounts.count(),
    2,
    "The fixture report has two stock items",
  );
  await physicalCounts.nth(0).fill("12.125");
  await physicalCounts.nth(1).fill("6.5");
  await page.getByRole("button", { name: "Save counts", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /Unsaved count edits/ })
    .waitFor({ state: "detached" });
  await assertShellIdentity();

  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/suppliers");
  const supplierRow = page
    .getByRole("table", { name: "Suppliers" })
    .locator("tbody tr")
    .first();
  await supplierRow
    .getByRole("button", { name: "More actions for North Farm Supply" })
    .click();
  const supplierActions = page.getByRole("menu");
  await supplierActions.waitFor({ state: "visible" });
  await page.getByRole("menuitem", { name: "View details" }).waitFor();
  await page.getByRole("menuitem", { name: "Edit" }).waitFor();
  await page.getByRole("menuitem", { name: "Deactivate" }).waitFor();
  await saveScreenshot("supplier-actions-menu-desktop.png");
  await page.keyboard.press("Escape");
  await supplierActions.waitFor({ state: "detached" });
  await page.setViewportSize({ width: 390, height: 844 });

  await navigate(
    `/suppliers?search=${encodeURIComponent("no fixture supplier matches this")}`,
  );
  await page.getByText(/No suppliers found/i).waitFor();
  await assertPageStructure("/suppliers filtered empty state", 390);

  assert.deepEqual(
    browserErrors,
    [],
    `Browser reported console or uncaught page errors. HTTP failures: ${JSON.stringify(failedResponses)}`,
  );
  console.log(
    "PASS authenticated client navigation, Back/Forward, and mutation refresh preserve the shell",
  );
  console.log(
    "PASS report and role dialogs support Escape and report count save refresh",
  );
  console.log("PASS supplier row actions open as a dismissible action menu");
  console.log(`Screenshots: ${path.relative(root, outputDirectory)}`);
})()
  .catch(async (error) => {
    console.error(error.stack ?? error.message);
    if (page) {
      try {
        const failureText = await page
          .locator("body")
          .innerText({ timeout: 2_000 });
        console.error(failureText.slice(0, 1_200));
        await page.screenshot({
          path: path.join(outputDirectory, "failure.png"),
        });
      } catch {
        // The browser may have exited before a useful page state was captured.
      }
    }
    if (serverOutput) console.error(serverOutput);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      if (process.platform === "win32" && server.pid) {
        await new Promise((resolve) => {
          const killer = spawn(
            "taskkill",
            ["/pid", String(server.pid), "/t", "/f"],
            {
              stdio: "ignore",
              windowsHide: true,
            },
          );
          killer.once("exit", resolve);
          killer.once("error", resolve);
        });
      } else {
        server.kill("SIGTERM");
      }
    }
    if (fixture) await fixture.close();
  });
