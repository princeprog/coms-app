// Register shift UI against the loopback fixture API; shift cash math and locking are verified in coms-api.
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
const output = path.join(root, "test-results/shifts-ui");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
const admin = process.env.SHIFT_UI_ROLE === "admin";
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
    authUser: admin
      ? seed.user
      : {
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

  if (admin) {
    await page.goto(`${baseUrl}/business-day`);
    await page
      .getByRole("heading", { name: "Business day", level: 1 })
      .last()
      .waitFor();
    await page.getByText("12:00 AM", { exact: true }).first().waitFor();
    await page.getByRole("combobox", { name: "Day starts at" }).click();
    await page.getByRole("option", { name: "6:00 AM", exact: true }).click();
    await page
      .getByRole("button", { name: "Schedule change", exact: true })
      .click();
    await page
      .getByText("Business day change scheduled", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Cancel change", exact: true })
      .waitFor();
    await noOverflow("business-day");
    await page
      .getByRole("button", { name: "Cancel change", exact: true })
      .click();
    await page
      .getByText("Scheduled change cancelled", { exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS business day: schedule and cancel a start time as Super Admin; responsive layout",
    );
    return;
  }

  await page.goto(`${baseUrl}/pos`);
  const gate = page.getByRole("region", { name: "Register" });
  await gate
    .getByRole("heading", { name: "Start your shift to use the register" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Search products").count(),
    0,
    "The register must stay hidden without a shift",
  );
  await page
    .locator("header")
    .first()
    .getByRole("link", { name: "Start shift", exact: true })
    .waitFor();
  await noOverflow("pos-no-shift");

  await gate.getByRole("link", { name: "Start shift", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/shifts/start");
  await page
    .getByRole("heading", { name: "Start shift", level: 1 })
    .last()
    .waitFor();
  const startButton = page.getByRole("button", {
    name: "Start shift",
    exact: true,
  });
  await startButton.click();
  await page.getByText("Enter an amount", { exact: false }).first().waitFor();
  await page
    .getByRole("radio", { name: "Count bills & coins", exact: true })
    .click();
  await page.getByLabel("Number of ₱500").fill("2");
  await page.locator("[aria-live=polite]", { hasText: "₱1,000.00" }).waitFor();
  await noOverflow("start-shift");
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === "/pos");
  await page.getByText("Shift 1 started", { exact: true }).waitFor();
  await page.getByLabel("Search products").waitFor();

  const shiftMenu = page.getByRole("button", { name: /^Shift 1 at / });
  await shiftMenu.click();
  await page.getByRole("menuitem", { name: "Cash in / out" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount").fill("100");
  await dialog.getByLabel("Reason").fill("Bought ice");
  await dialog
    .getByRole("button", { name: "Record cash out", exact: true })
    .click();
  await page
    .getByText("Cash out of ₱100.00 recorded", { exact: true })
    .waitFor();

  await shiftMenu.click();
  await page.getByRole("menuitem", { name: "End shift" }).click();
  await page.waitForURL((url) => url.pathname === "/shifts/end");
  const form = page.locator("main form");
  await form.getByText("Bought ice", { exact: true }).waitFor();
  await form
    .getByText("Expected cash appears after you submit", { exact: false })
    .waitFor();
  assert.equal(
    await page.getByText("₱900.00").count(),
    0,
    "Expected cash must stay hidden before the count",
  );
  await noOverflow("end-shift-review");
  await form.getByRole("button", { name: "Count drawer", exact: true }).click();
  await form.getByRole("textbox", { name: "Cash in drawer" }).fill("890");
  await form.getByRole("textbox", { name: "Leave for next shift" }).fill("900");
  await form.getByRole("button", { name: "Review count", exact: true }).click();
  await form
    .getByText("Cannot be more than the counted cash", { exact: true })
    .waitFor();
  await form.getByRole("textbox", { name: "Leave for next shift" }).fill("500");
  await form.getByRole("button", { name: "Review count", exact: true }).click();
  await form.getByText("₱390.00", { exact: true }).waitFor();
  await noOverflow("end-shift-confirm");
  await form.getByRole("button", { name: "End shift", exact: true }).click();
  await form.getByText("Short ₱10.00", { exact: true }).waitFor();
  await form.getByText("₱900.00", { exact: true }).waitFor();
  await noOverflow("end-shift-result");
  await form.getByLabel(/What happened/).fill("Gave extra change");
  await form
    .getByRole("button", { name: "Save and finish", exact: true })
    .click();
  await page.waitForURL((url) => url.pathname === "/pos");
  await gate
    .getByRole("heading", { name: "Start your shift to use the register" })
    .waitFor();

  await page.goto(`${baseUrl}/shifts`);
  const table = page.getByRole("table", { name: "Register shifts" });
  await table.getByText("Needs review", { exact: true }).waitFor();
  await table.getByText("Short ₱10.00", { exact: true }).waitFor();
  await noOverflow("shifts-list");
  await page.getByRole("button", { name: /^Actions for shift 1/ }).focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.getByRole("menuitem", { name: "Review shift" }).count(),
    0,
    "Own shifts must not offer review",
  );
  await page.getByRole("menuitem", { name: "View shift" }).click();
  await page.getByRole("heading", { name: "Shift 1", level: 1 }).waitFor();
  await page.getByText("Bought ice").waitFor();
  await page.getByText("Gave extra change", { exact: true }).waitFor();
  await page
    .getByText("Another manager must review a shift you worked.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Mark reviewed", exact: true })
      .count(),
    0,
  );
  await noOverflow("shift-detail");
  for (const theme of ["dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.screenshot({
      path: path.join(output, `shift-detail-${theme}.png`),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS shifts: POS gate without a shift, start page with bills-and-coins count, header cash out, stepped blind end with shortfall and explanation, return to gate, list and detail, self-review guard, responsive layouts",
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
