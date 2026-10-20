// Production UI checks against synthetic loopback data; no live records are changed.
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
const seed = require("./fixtures/operational-api.json");
let fixture,
  server,
  browser,
  output = "";
const freePort = () =>
  new Promise((resolve) => {
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1", () => {
      const port = listener.address().port;
      listener.close(() => resolve(port));
    });
  });
(async () => {
  const gatewaySecret = crypto.randomBytes(32).toString("hex");
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    notificationCount: 26,
  });
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      path.join(process.cwd(), "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(port),
      "-H",
      "127.0.0.1",
    ],
    {
      cwd: process.cwd(),
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
    stream.on("data", (chunk) => {
      output = (output + chunk).slice(-8000);
    });
  for (let attempt = 0; attempt < 160; attempt++) {
    try {
      if ((await fetch(baseUrl)).status < 500) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push({ message: error.message, url: page.url() });
    console.error("Browser error at", page.url(), error.message);
  });
  await page.goto(baseUrl);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  const bell = page.getByRole("button", {
    name: "Notifications, 26 unread",
    exact: true,
  });
  await bell.waitFor();
  await bell.focus();
  await page.keyboard.press("Enter");
  const popup = page
    .locator('[data-slot="popover-content"]')
    .filter({ has: page.getByText("View all notifications", { exact: true }) });
  await popup.getByRole("list", { name: "Notifications" }).waitFor();
  assert.equal(await popup.locator("li").count(), 10);
  const triggerBox = await bell.boundingBox(),
    popupBox = await popup.boundingBox();
  assert(
    popupBox.y >= triggerBox.y + triggerBox.height,
    "bell opens below the trigger",
  );
  await page.keyboard.press("Escape");
  await popup.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "Notifications, 26 unread",
  );
  assert(
    await bell.evaluate((element) => element === document.activeElement),
    "Escape restores focus",
  );
  await page.goto(`${baseUrl}/notifications`);
  await page.getByText("1–10 of 26", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByText("11–20 of 26", { exact: true }).waitFor();
  await page
    .getByRole("combobox", { name: "Rows per page", exact: true })
    .click();
  await page.getByRole("option", { name: "30", exact: true }).click();
  await page.getByText("1–26 of 26", { exact: true }).waitFor();
  await page
    .getByRole("combobox", { name: "Notification type", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Daily reports", exact: true })
    .click();
  await page.getByText("1–13 of 13", { exact: true }).waitFor();
  await page
    .getByRole("list", { name: "Notifications" })
    .locator("a")
    .first()
    .click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/reports" &&
      url.searchParams.has("report_id") &&
      !url.searchParams.has("notification_id"),
  );
  await page
    .getByRole("button", { name: "Notifications, 25 unread", exact: true })
    .waitFor();

  // A cancelled dirty-form navigation must not consume a notification.
  await page.goto(`${baseUrl}/products/new`);
  await page
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Unsaved fixture meal");
  await page
    .getByRole("button", { name: "Notifications, 25 unread", exact: true })
    .click();
  await popup
    .getByRole("list", { name: "Notifications" })
    .locator("a")
    .first()
    .click();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(
    await page
      .getByRole("textbox", { name: "Product name", exact: true })
      .inputValue(),
    "Unsaved fixture meal",
  );
  assert.equal(
    (
      await (await fetch(fixture.baseUrl + "/__fixture/state")).json()
    ).notifications.filter((item) => !item.read_at).length,
    25,
  );
  await popup.waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Notifications, 25 unread", exact: true })
    .click();
  await popup
    .getByRole("list", { name: "Notifications" })
    .locator("a")
    .first()
    .click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.waitForURL(
    (url) =>
      url.pathname.startsWith("/dispatches/") &&
      !url.searchParams.has("notification_id"),
  );
  await page
    .getByRole("button", { name: "Notifications, 24 unread", exact: true })
    .waitFor();

  await page.goto(`${baseUrl}/notifications`);
  await page.getByText("1–10 of 26", { exact: true }).waitFor();
  await fetch(fixture.baseUrl + "/__fixture/fail-next", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "PATCH",
      path: "/notifications/read-all",
      status: 503,
      message: "Fixture failure",
    }),
  });
  await page
    .getByRole("button", { name: "Mark all as read", exact: true })
    .click();
  await page
    .getByText("Could not mark notifications as read. Please try again.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Notifications, 24 unread", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Mark all as read", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Notifications, 0 unread", exact: true })
    .waitFor();
  await page.getByRole("button", { name: /^Unread/ }).click();
  await page.getByText("You’re all caught up", { exact: true }).waitFor();
  await page.getByRole("button", { name: "All", exact: true }).click();
  fs.mkdirSync("test-results/notifications", { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByText("1–10 of 26", { exact: true }).waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `no overflow at ${width}`,
    );
    await page.screenshot({
      path: `test-results/notifications/inbox-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: "test-results/notifications/inbox-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page
    .getByRole("button", { name: "Notifications, 0 unread", exact: true })
    .click();
  await popup.waitFor();
  await page.screenshot({
    path: "test-results/notifications/bell.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: bell placement, keyboard focus, pagination, filters, report/dispatch links, dirty-form cancellation/confirmation, read failure/retry, empty state, responsive/dark layouts, no browser errors. Synthetic UI data only.",
  );
})()
  .catch((error) => {
    console.error(error);
    console.error(output);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server?.kill();
    await fixture?.close();
  });
