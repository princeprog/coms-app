// Receiving UI checks against the disposable loopback API; no real stock writes.
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
const output = path.join(root, "test-results/purchases-ui");
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

(async () => {
  fs.mkdirSync(output, { recursive: true });
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    authUser: {
      ...seed.user,
      permissions: seed.user.permissions.filter(
        (permission) => permission !== "suppliers.read",
      ),
      role: {
        ...seed.user.role,
        code: "COMMISSARY_MANAGER",
        name: "Commissary Manager",
        isSystem: false,
      },
    },
  });
  const initial = await (
    await fetch(`${fixture.baseUrl}/__fixture/state`)
  ).json();
  initial.receipts.sort(
    (a, b) =>
      b.received_at.localeCompare(a.received_at) ||
      b.created_at.localeCompare(a.created_at) ||
      b.id.localeCompare(a.id),
  );
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
    stream.on("data", (chunk) => {
      serverOutput = (serverOutput + chunk).slice(-8000);
    });
  const deadline = Date.now() + 45000;
  let ready = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    try {
      ready = (await fetch(baseUrl)).status < 500;
    } catch {
      /* Still starting. */
    }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, "Production server did not become ready");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(baseUrl);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  // This fixture manager has POS access and no dashboard grant.
  await page.waitForURL("**/pos");
  await page.goto(`${baseUrl}/inventory`);
  await page.getByRole("button", { name: "Restock", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Review purchase", exact: true })
    .click();
  await dialog.getByText("Choose a stock item", { exact: true }).waitFor();
  assert((await dialog.locator('[aria-invalid="true"]').count()) > 0);
  await dialog.getByLabel("Store (optional)").fill("Puregold Quezon City");
  await dialog.getByLabel("Receipt number (optional)").fill("PG-2026-001");
  const picker = dialog.getByRole("combobox").first();
  await picker.fill("Flour");
  await page.getByRole("option").first().waitFor();
  await picker.press("ArrowDown");
  await picker.press("Enter");
  await dialog.getByLabel(/^Quantity/).fill("2.5");
  await dialog.getByLabel("Unit cost (PHP)").fill("13.25");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Keep editing" })
    .click();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    assert(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    );
    await page.screenshot({
      path: path.join(output, `entry-${width}.png`),
      fullPage: true,
    });
  }
  await dialog
    .getByRole("button", { name: "Review purchase", exact: true })
    .click();
  await dialog.getByText("33.125", { exact: true }).first().waitFor();
  await page.screenshot({
    path: path.join(output, "review.png"),
    fullPage: true,
  });
  await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "POST",
      path: "/direct-purchases",
      status: 503,
      message: "Purchase service unavailable. Try again.",
    }),
  });
  await dialog
    .getByRole("button", { name: "Confirm purchase", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  assert.equal(
    await dialog.getByText("Puregold Quezon City", { exact: true }).count(),
    1,
  );
  const successToast = page
    .getByText("Purchase recorded. Commissary stock updated.", { exact: true })
    .waitFor();
  await dialog
    .getByRole("button", { name: "Confirm purchase", exact: true })
    .click();
  await successToast;
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Purchase received", { exact: true }).waitFor();
  const recorded = await (
    await fetch(`${fixture.baseUrl}/__fixture/state`)
  ).json();
  assert.equal(recorded.purchases.length, 1);
  assert.equal(
    recorded.commissaryBalances.find((item) => item.stock_item_name === "Flour")
      .quantity_on_hand,
    "22.75",
  );
  await page.getByRole("link", { name: "View purchases", exact: true }).click();
  await page
    .getByRole("table", { name: "Direct purchases", exact: true })
    .waitFor();
  await page.getByText("Puregold Quezon City", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Actions for Puregold Quezon City" })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "View purchase" }).click();
  await page
    .getByRole("dialog")
    .getByRole("heading", { name: "Purchase details" })
    .waitFor();
  await page
    .getByRole("dialog")
    .getByText("33.125", { exact: true })
    .first()
    .waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("textbox", { name: "Search store or receipt" })
    .fill("no matching store");
  await page.getByText("No purchases found.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByText("Puregold Quezon City", { exact: true }).waitFor();
  for (let index = 0; index < 12; index++) {
    const response = await fetch(`${fixture.baseUrl}/direct-purchases`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-coms-auth-gateway": gatewaySecret,
        cookie: "coms_access=fixture-access-token",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        purchase_date: "2026-10-01",
        store_name: "SM Hypermarket",
        receipt_number: `SM-${index}`,
        items: [
          {
            stock_item_id: recorded.purchases[0].items[0].stock_item_id,
            quantity_received: "1",
            unit_cost: "20",
          },
        ],
      }),
    });
    assert.equal(response.status, 201);
  }
  await page.reload();
  await page
    .getByText("Showing 1-10 of 13 purchases", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByText("Showing 11-13 of 13 purchases", { exact: true })
    .waitFor();
  await page
    .getByRole("combobox", { name: "Rows per page", exact: true })
    .click();
  await page.getByRole("option", { name: "30 per page", exact: true }).click();
  await page
    .getByText("Showing 1-13 of 13 purchases", { exact: true })
    .waitFor();
  await page
    .getByRole("combobox", { name: "Rows per page", exact: true })
    .click();
  await page.getByRole("option", { name: "50 per page", exact: true }).click();
  await page.waitForURL("**page_size=50*");
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      assert(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      );
      await page.screenshot({
        path: path.join(output, `history-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS direct purchase: keyboard selection, inline errors, dirty guard, exact review, failed save and retry, one stock posting, activity, URL details, search, light/dark responsive layouts; no suppliers.read",
  );
})()
  .catch(async (error) => {
    console.error(error.stack ?? error.message);
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
        .catch(() => {});
    if (serverOutput) console.error(serverOutput);
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
