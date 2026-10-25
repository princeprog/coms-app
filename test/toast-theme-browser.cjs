// Runs only against the loopback synthetic API, never the development database.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { chromium } = require("playwright");
const {
  createOperationalApiFixture,
} = require("./operational-api-fixture.cjs");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "test-results/toast-theme");
const seed = require("./fixtures/operational-api.json");
let fixture, server, browser, page;
let logs = "";
const errors = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function port() {
  return new Promise((resolve) => {
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1", () => {
      const value = listener.address().port;
      listener.close(() => resolve(value));
    });
  });
}
async function theme(name) {
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
}
async function clearToasts() {
  for (let i = 0; i < 12; i++) {
    const close = page.locator(
      '[data-sileo-toast]:not([data-exiting="true"]) [data-sileo-close]',
    );
    if (!(await close.count())) break;
    await close.first().click();
    await pause(650);
  }
}
async function checkToastBounds(width) {
  const result = await page
    .locator("[data-sileo-toast]")
    .first()
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      const svg = el.querySelector("[data-sileo-svg]").getBoundingClientRect();
      const title = el.querySelector("[data-sileo-title]");
      return {
        x: box.x,
        right: box.right,
        bottom: box.bottom,
        svgRight: svg.right,
        viewport: innerWidth,
        height: innerHeight,
        overflow: document.documentElement.scrollWidth,
        fill: getComputedStyle(el.querySelector("[data-sileo-pill]")).fill,
        expectedFill: getComputedStyle(document.documentElement)
          .getPropertyValue("--popover")
          .trim(),
        titleColor: getComputedStyle(title).color,
        descriptionColor: getComputedStyle(
          el.querySelector("[data-sileo-description]"),
        ).color,
        transform: getComputedStyle(title).textTransform,
      };
    });
  assert(result.x >= 15 && result.right <= width - 15, JSON.stringify(result));
  assert(result.svgRight <= width - 15, JSON.stringify(result));
  assert(result.bottom <= result.height - 15, JSON.stringify(result));
  assert(result.overflow <= width + 1, JSON.stringify(result));
  assert.equal(result.transform, "none");
  assert.notEqual(
    result.descriptionColor,
    result.titleColor,
    "Description uses neutral text while the heading uses its status color",
  );
  return result;
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const gatewaySecret = randomBytes(32).toString("hex");
  fixture = await createOperationalApiFixture({ gatewaySecret });
  const serverPort = await port();
  const base = `http://127.0.0.1:${serverPort}`;
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(serverPort),
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        COMS_API_BASE_URL: fixture.baseUrl,
        COMS_AUTH_GATEWAY_SECRET: gatewaySecret,
      },
    },
  );
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (data) => (logs = (logs + data).slice(-5000)));
  let ready = false;
  for (let i = 0; i < 120 && !ready; i++) {
    ready = await fetch(base).then(
      (r) => r.status < 500,
      () => false,
    );
    if (!ready) await pause(250);
  }
  assert(ready, logs);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await theme("Dark");
  assert(
    await page.locator("html").evaluate((el) => el.classList.contains("dark")),
  );
  await page.reload();
  assert(
    await page.locator("html").evaluate((el) => el.classList.contains("dark")),
  );
  await page.keyboard.press("d");
  assert(
    await page.locator("html").evaluate((el) => el.classList.contains("dark")),
  );
  await theme("System");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 700 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: path.join(output, `login-${width}.png`) });
  }
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/branches`);
  await page.getByRole("button", { name: "Add branch", exact: true }).click();
  await page
    .getByLabel("Branch name", { exact: true })
    .fill("Manila - Toast Preview");
  await page
    .getByRole("button", { name: "Create branch", exact: true })
    .click();
  const success = page.locator('[data-sileo-toast][data-state="success"]');
  await success.waitFor();
  await success.focus();
  assert.equal(await page.locator("[data-sileo-viewport]").count(), 1);
  assert(await success.getByText("Branch created.", { exact: true }).count());
  const fills = [];
  for (const mode of ["Light", "Dark"]) {
    await theme(mode);
    await success.focus();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => {
        const toast = document.querySelector("[data-sileo-toast]");
        return (
          toast &&
          Math.abs(
            toast.getBoundingClientRect().width -
              Number(
                toast
                  .querySelector("svg[data-sileo-svg]")
                  .getAttribute("width"),
              ),
          ) < 1
        );
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      const state = await checkToastBounds(width);
      fills.push({ mode, width, ...state });
      await page.screenshot({
        path: path.join(output, `success-${mode.toLowerCase()}-${width}.png`),
      });
    }
  }
  assert.notEqual(fills[0].fill, fills[4].fill);
  assert.notEqual(fills[0].titleColor, fills[4].titleColor);
  assert.equal(
    await success.evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.keyboard.press("Escape");
  await success.waitFor({ state: "detached" });
  await page.goto(`${base}/change-password`);
  await page.getByRole("button", { name: "Change theme" }).waitFor();
  await theme("Light");
  await page.screenshot({ path: path.join(output, "password-mobile.png") });
  await page.goto(`${base}/inventory`);
  let messageNumber = 0;
  await page.route("**/api/exports/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: `Export ${++messageNumber} could not be created. Please retry when the connection returns.`,
      }),
    }),
  );
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: "Export stock", exact: true })
      .first()
      .click();
    await page.waitForFunction(
      () =>
        ![...document.querySelectorAll("button")].some((button) =>
          button.textContent.includes("Exporting…"),
        ),
    );
  }
  assert.equal(await page.locator("[data-sileo-toast]").count(), 3);
  assert.equal(await page.getByText(/^Export 4 could/).count(), 0);
  await page.locator("[data-sileo-toast]").first().focus();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-sileo-toast]")].every(
      (el) => el.getAttribute("data-expanded") === "true",
    ),
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-sileo-title]")].every(
      (el) => el.scrollWidth <= el.clientWidth + 1,
    ),
  );
  await page.screenshot({ path: path.join(output, "errors-mobile.png") });
  await page.locator("[data-sileo-close]").first().click();
  await page.getByText(/^Export 4 could/).waitFor();
  await checkToastBounds(320);
  assert.equal(await page.locator("button button, button a").count(), 0);
  const snapshot = await page.locator("[data-sileo-viewport]").ariaSnapshot();
  assert(snapshot.includes("alert"));
  assert(snapshot.includes("Export"));
  await clearToasts();
  // A request can finish after the user opens a modal. Its error must remain
  // readable without replacing the form or taking keyboard focus.
  await page.unroute("**/api/exports/**");
  let pendingExport;
  await page.route("**/api/exports/**", (route) => {
    pendingExport = route;
  });
  await page
    .getByRole("button", { name: "Export stock", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Restock", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Restock", exact: true });
  await modal.waitFor();
  assert(pendingExport);
  await pendingExport.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({
      message:
        "Export unavailable while you prepare this restock. Please try again.",
    }),
  });
  const modalError = page.locator('[data-sileo-toast][data-state="error"]');
  await modalError.waitFor();
  await modalError
    .getByText(
      "Export unavailable while you prepare this restock. Please try again.",
    )
    .waitFor();
  assert.equal(
    await modalError.evaluate((el) =>
      Boolean(el.closest('[aria-hidden="true"], [inert]')),
    ),
    false,
  );
  assert(await modal.evaluate((el) => el.contains(document.activeElement)));
  await page.screenshot({ path: path.join(output, "error-with-modal.png") });
  await modal.getByRole("button", { name: "Close Restock" }).click();
  await clearToasts();
  await page.unroute("**/api/exports/**");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${base}/roles/new`);
  await page.getByRole("textbox", { name: "Role name" }).fill("Toast reviewer");
  await page.getByRole("textbox", { name: "Role code" }).fill("TOAST_REVIEWER");
  await page.getByRole("button", { name: "Create role", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/roles");
  await page.locator("[data-sileo-toast]").getByText("Role created.").waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-sileo-toast]")
        ?.getAttribute("data-ready") === "true",
  );
  assert.notEqual(
    await page
      .locator("[data-sileo-toast]")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  const pill = await page.locator("[data-sileo-header]").boundingBox();
  await page.mouse.move(pill.x + 20, pill.y + 20);
  await page.mouse.down();
  await page.mouse.move(pill.x + 20, pill.y - 30, { steps: 4 });
  await page.mouse.up();
  await page.locator("[data-sileo-toast]").waitFor({ state: "detached" });
  assert((await page.locator("[data-sileo-viewport]").count()) <= 1);
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(output, "appearance.json"),
    JSON.stringify(fills, null, 2),
  );
  console.log(
    "PASS theme persistence/System/D removal, public and authenticated controls, light/dark responsive toasts, errors, queue, keyboard dismissal, accessibility tree and save/redirect.",
  );
})()
  .catch(async (error) => {
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png") })
        .catch(() => {});
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await pause(300);
    }
    if (fixture) await fixture.close();
  });
