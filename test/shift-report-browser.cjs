// Shift report page against the loopback fixture API; report figures are computed and verified in coms-api.
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
  fs.readFileSync(
    path.join(__dirname, "fixtures/operational-api.json"),
    "utf8",
  ),
);
const output = path.join(root, "test-results/shift-report-ui");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
const errors = [];
let fixture, server, browser, page;
let serverOutput = "";

async function freePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const port = listener.address().port;
      listener.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function noOverflow(label) {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    assert(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
      `${label} overflows at ${width}px`,
    );
    await page.screenshot({
      path: path.join(output, `${label}-${width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 960 });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    openShifts: false,
    sampleReport: true,
    authUser: {
      ...seed.user,
      branch_ids: ["10000000-0000-4000-8000-000000000001"],
      permissions: [
        ...seed.user.permissions,
        "shifts.read",
        "shifts.operate",
        "shifts.review",
      ],
      role: {
        ...seed.user.role,
        code: "BRANCH_MANAGER",
        name: "Branch Manager",
        isSystem: false,
      },
    },
  });
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(port),
      "--hostname",
      "127.0.0.1",
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
  for (const stream of [server.stdout, server.stderr])
    stream.on(
      "data",
      (chunk) => (serverOutput = (serverOutput + chunk).slice(-8000)),
    );
  const deadline = Date.now() + 45000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    ready = await fetch(baseUrl).then(
      (r) => r.status < 500,
      () => false,
    );
    if (!ready) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, "Production server did not become ready");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await (
    await browser.newContext({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "reduce",
    })
  ).newPage();
  page.on("pageerror", (error) =>
    errors.push(`${new URL(page.url()).pathname}: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`${new URL(page.url()).pathname}: ${message.text()}`);
  });
  await page.goto(baseUrl);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/"));

  const branchId = "10000000-0000-4000-8000-000000000001";
  await page.goto(
    `${baseUrl}/shifts/51000000-0000-4000-8000-000000000001?branch=${branchId}`,
  );
  await page.getByRole("heading", { name: "Shift 1", level: 1 }).waitFor();
  await page.getByText("Needs review", { exact: true }).first().waitFor();

  const summary = page.locator("dl[aria-label='Shift summary']");
  for (const value of [
    "₱7,583.00",
    "Gross ₱7,851.00",
    "31",
    "92 items sold · 1 voided",
    "₱244.61",
    "Short ₱12.00",
    "Counted ₱6,750.00 of ₱6,762.00 expected",
  ])
    await summary.getByText(value, { exact: true }).waitFor();

  const cash = page.getByRole("region", { name: "Cash drawer" });
  for (const value of [
    "+₱4,880.00",
    "−₱268.00",
    "₱6,762.00",
    "₱6,750.00",
    "₱4,750.00",
  ])
    assert(
      (await cash.innerText()).replaceAll(/\s/g, "").includes(value),
      `Cash drawer is missing ${value}`,
    );
  await cash.getByText("Short ₱12.00", { exact: true }).waitFor();

  const sales = page.getByRole("region", { name: "Sales" });
  await sales
    .getByRole("region", { name: "By payment method" })
    .getByText("GCash")
    .waitFor();
  await sales
    .getByRole("region", { name: "By service" })
    .getByText("Takeout")
    .waitFor();
  await sales.getByText("₱7,851.00", { exact: true }).waitFor();

  const products = page.getByRole("region", { name: "Products sold" });
  const productRows = products.locator("tbody tr");
  assert.equal(await productRows.count(), 8, "Products start with a preview");
  assert.equal(await products.getByText("Gravy Cup").count(), 0);
  const toggle = products.getByRole("button", { name: "Show all 10 products" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await products.getByText("Gravy Cup", { exact: true }).waitFor();
  assert.equal(await productRows.count(), 10);
  assert.equal(
    await products
      .getByRole("button", { name: "Show fewer" })
      .getAttribute("aria-expanded"),
    "true",
  );
  await products.getByText("92", { exact: true }).waitFor();

  const facts = page.getByRole("region", { name: "Shift details" });
  await facts.getByText("Maria Santos", { exact: true }).waitFor();
  await facts.getByText("8h 6m", { exact: true }).waitFor();
  await facts.getByText(/6:24.*1:51/).waitFor();

  const activity = page.getByRole("region", { name: "Activity" });
  for (const text of [
    "Shift opened",
    "Cash in · Change fund from main office",
    "Cash out · Paid LPG refill",
    "Voided S-001284",
    "Customer cancelled the order",
    "Shift closed",
    "Gave ₱12 extra change during the lunch rush.",
  ])
    await activity.getByText(text, { exact: true }).waitFor();

  await noOverflow("shift-report");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({
    path: path.join(output, "shift-report-dark.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });

  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await page
    .getByText("Add a note about the cash difference", { exact: true })
    .waitFor();
  await page
    .getByLabel("Review note")
    .fill("Counted with Maria; change error confirmed.");
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await page.getByText("Reviewed", { exact: true }).first().waitFor();
  await activity
    .getByText("Counted with Maria; change error confirmed.", { exact: true })
    .waitFor();
  await facts.getByText("Reviewed by", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Mark reviewed", exact: true })
      .count(),
    0,
  );
  await noOverflow("shift-report-reviewed");

  assert.deepEqual(errors, []);
  console.log(
    "PASS shift report: headline figures, cash drawer statement, sales breakdowns, product preview and keyboard toggle, details, activity timeline, review flow, responsive and dark layouts",
  );
})()
  .catch(async (error) => {
    console.error(error.stack ?? error.message);
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
        .catch(() => {});
    if (serverOutput) console.error(serverOutput.slice(-3000));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once("exit", resolve));
    }
    if (fixture) await fixture.close();
  });
