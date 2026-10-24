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

  await page
    .getByRole("button", { name: "Notifications, 26 unread", exact: true })
    .waitFor();
  await page.evaluate(() => {
    window.__tones = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.__tones++;
      return start.apply(this, args);
    };
  });
  const tones = () => page.evaluate(() => window.__tones);
  const toggleBell = () =>
    page.getByRole("button", { name: /^Notifications, .* unread$/ });
  const setting = page.getByRole("button", {
    name: "Notification sound",
    exact: true,
  });
  await toggleBell().click();
  await setting.waitFor();
  assert.equal(await setting.getAttribute("aria-pressed"), "true");
  assert.equal(await tones(), 0, "initial unread items are silent");
  await page.keyboard.press("Escape");
  fixture.addNotification();
  await toggleBell().click(); // Opening triggers the same count refetch as polling.
  await page.waitForFunction(() => window.__tones === 2);
  await page
    .getByRole("button", { name: "Notifications, 27 unread", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await toggleBell().click();
  await setting.waitFor();
  assert.equal(await tones(), 2, "unchanged responses do not repeat sound");
  await setting.click();
  assert.equal(await setting.getAttribute("aria-pressed"), "false");
  await page.keyboard.press("Escape");
  fixture.addNotification();
  await toggleBell().click();
  await page
    .getByRole("button", { name: "Notifications, 28 unread", exact: true })
    .waitFor();
  assert.equal(await tones(), 2, "muted notifications remain silent");
  await page.reload();
  await toggleBell().click();
  await setting.waitFor();
  assert.equal(
    await setting.getAttribute("aria-pressed"),
    "false",
    "mute persists after reload",
  );
  await page.evaluate(() => {
    window.__tones = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.__tones++;
      return start.apply(this, args);
    };
  });
  await setting.click();
  assert.equal(
    await tones(),
    0,
    "enabling does not replay previous notifications",
  );
  fs.mkdirSync("test-results/notification-sound", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await setting.waitFor();
    await page.screenshot({
      path: "test-results/notification-sound/bell-" + width + ".png",
    });
  }
  await page.keyboard.press("Escape");
  fixture.addNotification();
  // Verify a real background interval, without opening the bell to force a fetch.
  await page.waitForFunction(
    () => window.__tones === 2,
    {},
    { timeout: 45000 },
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS silent initial load, real Web Audio chime, polling, no duplicate sounds, mute persistence, enabling without replay, desktop/mobile toggle",
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
