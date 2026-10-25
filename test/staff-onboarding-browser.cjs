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
const output = path.join(root, "test-results/staff-onboarding");
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
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const gatewaySecret = randomBytes(32).toString("hex");
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    authUser: { ...seed.user, must_change_password: true },
    defaultPasswordConfigured: false,
  });
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

  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);

  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/change-password/);
  for (const route of ["/dashboard", "/staff", "/"]) {
    await page.goto(base + route);
    await page.waitForURL(/change-password/);
    assert.equal(
      await page
        .getByRole("heading", { name: "Choose a new password" })
        .count(),
      1,
    );
    assert.equal(
      await page.getByRole("link", { name: "Back", exact: true }).count(),
      0,
    );
  }
  await page
    .getByLabel("Current password", { exact: true })
    .fill(seed.login.password);
  await page
    .getByLabel("New password", { exact: true })
    .fill("Personal synthetic password 7!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("Personal synthetic password 7!");
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await page.waitForURL(/dashboard/);
  await page.goto(base + "/staff");
  assert.equal(
    await page.getByRole("button", { name: "Add staff", exact: true }).count(),
    0,
  );
  await page.getByText(/must set the default password/).waitFor();
  await clearToasts();
  for (const appearance of ["Light", "Dark"]) {
    await theme(appearance);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 700 });
      await page
        .getByRole("button", { name: "Default password", exact: true })
        .click();
      const modal = page.getByRole("dialog", {
        name: "Default password",
        exact: true,
      });
      await modal.waitFor();
      await modal.evaluate(async (el) => {
        await Promise.all(
          el
            .getAnimations({ subtree: true })
            .map((a) => a.finished.catch(() => {})),
        );
      });
      const box = await modal.boundingBox();
      assert(box.x >= 15 && box.x + box.width <= width - 15);
      assert(box.y >= 0 && box.y + box.height <= 700);
      assert(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth));
      await page.screenshot({
        path: path.join(output, appearance + "-" + width + ".png"),
      });
      await page.keyboard.press("Escape");
      await modal.waitFor({ state: "detached" });
      assert.equal(
        await page
          .getByRole("button", { name: "Default password", exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
    }
  }
  await page
    .getByRole("button", { name: "Default password", exact: true })
    .click();
  const modal = page.getByRole("dialog", {
    name: "Default password",
    exact: true,
  });
  await modal
    .getByLabel("New default password", { exact: true })
    .fill("Synthetic new staff password 2!");
  await modal
    .getByLabel("Confirm default password", { exact: true })
    .fill("Synthetic new staff password 2!");
  await fetch(fixture.baseUrl + "/__fixture/fail-next", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "PUT",
      path: "/staff/default-password",
      status: 503,
      message: "Synthetic save failure",
    }),
  });
  await modal.getByRole("button", { name: "Save default password" }).click();
  await modal.getByRole("alert").waitFor();
  assert.equal(
    await modal
      .getByLabel("New default password", { exact: true })
      .inputValue(),
    "Synthetic new staff password 2!",
  );
  await modal.getByRole("button", { name: "Save default password" }).click();
  await modal.waitFor({ state: "detached" });
  await page.getByText("Default password saved", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Add staff", exact: true }).waitFor();
  await clearToasts();
  await page.getByRole("button", { name: "Add staff", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Add staff", exact: true });
  assert.equal(await create.locator('input[type="password"]').count(), 0);
  await create.getByText(/must change it at their first sign-in/).waitFor();
  await page.screenshot({
    path: path.join(output, "create-without-password.png"),
  });
  await create
    .getByLabel("Full name", { exact: true })
    .fill("Onboarding Staff");
  await create
    .getByLabel("Email", { exact: true })
    .fill("onboarding@example.test");
  await create.getByLabel("Contact number", { exact: true }).fill("9171234567");
  await create
    .getByRole("button", { name: "Create staff", exact: true })
    .click();
  await create.waitFor({ state: "detached" });
  await page.getByText("Staff account created.", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS first-login redirect, direct-route blocking, password change, admin setup, save failure/retry, responsive themes and keyboard focus.",
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
