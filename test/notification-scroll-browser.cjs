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

  await page.goto(baseUrl + "/staff?search=no-matching-staff");
  const popup = page
    .locator('[data-slot="popover-content"]')
    .filter({ has: page.getByText("View all notifications", { exact: true }) });
  fs.mkdirSync("test-results/notification-scroll", { recursive: true });
  const results = [];
  for (const [width, height] of [
    [1440, 900],
    [1440, 500],
    [390, 700],
    [320, 480],
    [768, 360],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    const before = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      y: scrollY,
    }));
    await bell.click();
    await popup.getByRole("list", { name: "Notifications" }).waitFor();
    await popup.evaluate(async (el) => {
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const after = await popup.evaluate((el) => ({
      height: document.documentElement.scrollHeight,
      y: scrollY,
      box: el.getBoundingClientRect().toJSON(),
      position: getComputedStyle(el.parentElement).position,
      available: getComputedStyle(el.parentElement).getPropertyValue(
        "--available-height",
      ),
    }));
    results.push({ width, height, before, after });
    assert(
      after.box.top >= 0 && after.box.bottom <= height,
      "Notification panel must fit the viewport",
    );
    const scroller = popup
      .getByRole("list", { name: "Notifications" })
      .locator("..");
    await scroller.hover();
    await page.mouse.wheel(0, 500);
    await page.waitForFunction(
      (el) => el.scrollTop > 0,
      await scroller.elementHandle(),
    );
    assert.equal(
      await page.evaluate(() => scrollY),
      before.y,
      "Scrolling notifications must not move the page",
    );
    assert(
      await popup
        .getByText("View all notifications", { exact: true })
        .isVisible(),
    );

    await page.screenshot({
      path: "test-results/notification-scroll/" + width + "-" + height + ".png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
  }
  fs.writeFileSync(
    "test-results/notification-scroll/measurements.json",
    JSON.stringify(results, null, 2),
  );
  assert(
    results.every((r) => r.after.height <= r.before.height),
    "Opening the bell must not add document height",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS notification bell does not extend the document, fits the viewport and scrolls internally at desktop/mobile/landscape sizes.",
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
