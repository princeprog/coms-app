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
const output = path.join(root, "test-results/toast-close");
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

  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(base + "/staff");
  await page.getByRole("button", { name: "Add staff", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Add staff", exact: true });
  await create
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill("Maria Santos");
  await create
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("maria.santos@example.test");
  await create
    .getByRole("textbox", { name: "Contact number", exact: true })
    .fill("9171234567");
  await create
    .getByLabel("Initial password")
    .fill("Synthetic staff fixture 42!");
  await create
    .getByRole("button", { name: "Create staff", exact: true })
    .click();
  await create.waitFor({ state: "detached" });
  await page.getByText("Staff account created.", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "create-success.png") });

  const toast = page.locator("[data-sileo-toast]");
  await toast.focus();
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-sileo-toast]")
        ?.getAttribute("data-expanded") === "true",
  );
  for (const mode of ["Light", "Dark"]) {
    await theme(mode);
    await toast.focus();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      // A settled SVG must match its layout width even without resizing on mount.
      await page.waitForFunction(() => {
        const el = document.querySelector("[data-sileo-toast]");
        return (
          Math.abs(
            Number(el.querySelector("[data-sileo-svg]").getAttribute("width")) -
              el.clientWidth,
          ) < 1
        );
      });
      const bounds = await toast.evaluate((el) => {
        const box = (n) => {
          const r = n.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const title = el.querySelector("[data-sileo-title]"),
          description = el.querySelector("[data-sileo-description]");
        return {
          root: box(el),
          pill: box(el.querySelector("[data-sileo-pill]")),
          close: box(el.querySelector("[data-sileo-close]")),
          title: box(title),
          description: box(description),
          titleText: title.textContent,
          descriptionText: description.textContent,
          titleColor: getComputedStyle(title).color,
          descriptionColor: getComputedStyle(description).color,
        };
      });
      assert.equal(bounds.titleText, "Success");
      assert.equal(bounds.descriptionText, "Staff account created.");
      assert.notEqual(bounds.titleColor, bounds.descriptionColor);
      assert(bounds.root.x >= 15 && bounds.root.right <= width - 15);
      assert(
        bounds.close.x >= bounds.pill.x &&
          bounds.close.right <= bounds.pill.right,
      );
      assert(
        bounds.close.y >= bounds.pill.y &&
          bounds.close.bottom <= bounds.pill.bottom,
      );
      assert(bounds.description.y < bounds.title.y, JSON.stringify(bounds));
      await page.screenshot({
        path: path.join(output, mode + "-" + width + ".png"),
      });
    }
  }
  await toast.getByRole("button", { name: "Dismiss notification" }).click();
  await toast.waitFor({ state: "detached" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS staff success title/description, complete SVG surface, contained close button, both themes and 320/390/1440 layouts.",
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
