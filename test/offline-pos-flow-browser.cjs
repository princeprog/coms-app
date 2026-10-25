// Real cashier offline flow. Run against coms-api/test/offline-pos-browser-fixture.cjs
// after both production builds. Uses only the fixture's disposable database.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("../../coms-api/node_modules/pg");

const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(
      "../coms-api/node_modules/.cache/coms-offline-browser/fixture.json",
    ),
    "utf8",
  ),
);
assert.match(
  new URL(fixture.databaseUrl).pathname,
  /^\/coms_offline_browser_[a-f0-9]{32}$/,
);
const db = new Pool({ connectionString: fixture.databaseUrl });
const output = path.resolve("test-results/offline-pos-flow");
fs.mkdirSync(output, { recursive: true });
const pageErrors = [];
let browser, cashierPage;

async function check(label, work) {
  await work();
  console.log(`PASS ${label}`);
}
async function login(page, email, password) {
  await page.goto(fixture.origin);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/login") && url.pathname !== "/",
    { timeout: 30000 },
  );
}
async function until(work, message, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await work()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(message);
}

(async () => {
  // Service workers refuse the fixture's self-signed certificate without this flag.
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
    headless: true,
    args: ["--ignore-certificate-errors"],
  });
  const cashier = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  });
  // Headless browsers cannot grant persistent storage; installed Chrome/Edge apps normally do.
  await cashier.addInitScript(() => {
    if (navigator.storage) {
      navigator.storage.persist = async () => true;
      navigator.storage.persisted = async () => true;
    }
  });
  cashier.on("page", (page) =>
    page.on("pageerror", (error) => pageErrors.push(error.message)),
  );
  cashierPage = await cashier.newPage();
  const page = cashierPage;
  const product = (
    await db.query(
      "SELECT product_name, price::text FROM products WHERE id = $1",
      [fixture.productId],
    )
  ).rows[0];

  await check("cashier opens their shift online", async () => {
    await login(page, fixture.email, fixture.password);
    await page.goto(`${fixture.origin}/shifts/start`);
    const start = page
      .locator("form")
      .getByRole("button", { name: "Start shift" });
    await page
      .getByRole("textbox", { name: /Opening cash/ })
      .first()
      .waitFor();
    await page
      .getByRole("textbox", { name: /Opening cash/ })
      .first()
      .fill("1000");
    await until(() => start.isEnabled(), "Start shift stayed disabled");
    await start.click();
    await page
      .getByText(/Shift 1/)
      .first()
      .waitFor();
    await until(
      async () =>
        (
          await db.query(
            "SELECT count(*)::int n FROM register_shifts WHERE status = 'OPEN'",
          )
        ).rows[0].n === 1,
      "Shift was not opened",
    );
  });

  await check("cashier requests approval for this browser", async () => {
    await page.goto(`${fixture.origin}/pos?branch=${fixture.branchId}`);
    await page.getByRole("button", { name: "Register this browser" }).click();
    await page
      .getByRole("textbox", { name: "Register name" })
      .fill("Front counter");
    await page.getByRole("button", { name: "Request approval" }).click();
    await until(
      async () =>
        (
          await db.query(
            "SELECT count(*)::int n FROM pos_offline_devices WHERE status = 'PENDING'",
          )
        ).rows[0].n === 1,
      "Device request was not stored",
    );
    await page.getByText("Waiting for approval").waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Prepare offline POS" }).count(),
      0,
    );
    const requested = (
      await db.query(
        "SELECT u.email FROM notification_recipients nr JOIN notification_events ne ON ne.id = nr.event_id JOIN coms_auth.users u ON u.id = nr.user_id WHERE ne.kind = 'REGISTER_DEVICE_REQUESTED'",
      )
    ).rows.map((row) => row.email);
    assert(
      requested.includes(fixture.managerEmail),
      "Branch manager was not notified",
    );
    assert(
      !requested.includes(fixture.email),
      "Requesting cashier should not be notified",
    );
  });

  await check(
    "manager approves the register from the branch page",
    async () => {
      const manager = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: { width: 1440, height: 900 },
      });
      const managerPage = await manager.newPage();
      managerPage.on("pageerror", (error) => pageErrors.push(error.message));
      await login(managerPage, fixture.managerEmail, fixture.managerPassword);
      await managerPage.goto(
        `${fixture.origin}/branches/${fixture.branchId}/offline-pos`,
      );
      await managerPage
        .getByRole("button", { name: /Notifications/ })
        .first()
        .click();
      await managerPage
        .getByText("Register approval requested")
        .first()
        .waitFor();
      await managerPage.keyboard.press("Escape");
      await managerPage
        .getByRole("button", { name: "Register devices" })
        .click();
      await managerPage
        .getByRole("button", { name: "Actions for Front counter" })
        .click();
      await managerPage.getByRole("menuitem", { name: "Approve" }).click();
      await managerPage
        .getByRole("button", { name: "Approve register" })
        .click();
      await until(
        async () =>
          (
            await db.query(
              "SELECT count(*)::int n FROM pos_offline_devices WHERE status = 'APPROVED'",
            )
          ).rows[0].n === 1,
        "Device was not approved",
      );
      await managerPage.screenshot({
        path: path.join(output, "manager-devices.png"),
      });
      await manager.close();
    },
  );

  await check(
    "cashier prepares the register after the app files are saved",
    async () => {
      // The panel picks up the manager's decision on its own (polling and focus).
      await page
        .getByText("Approved", { exact: true })
        .waitFor({ timeout: 30000 });
      const approved = (
        await db.query(
          "SELECT u.email FROM notification_recipients nr JOIN notification_events ne ON ne.id = nr.event_id JOIN coms_auth.users u ON u.id = nr.user_id WHERE ne.kind = 'REGISTER_DEVICE_APPROVED'",
        )
      ).rows.map((row) => row.email);
      assert.deepEqual(approved, [fixture.email]);
      const prepare = page.getByRole("button", { name: "Prepare offline POS" });
      await until(
        () => prepare.isEnabled(),
        "Offline app files never became ready",
        60000,
      );
      await prepare.click();
      await page.getByRole("button", { name: "Finalize register" }).waitFor();
      const session = (
        await db.query("SELECT status FROM pos_offline_sessions")
      ).rows;
      assert.deepEqual(
        session.map((row) => row.status),
        ["OPEN"],
      );
    },
  );

  await check(
    "cash sale completes and is saved with the network off",
    async () => {
      await cashier.setOffline(true);
      await page
        .getByRole("button", { name: new RegExp(product.product_name) })
        .first()
        .click();
      await page.getByRole("textbox", { name: "Amount received" }).fill("1000");
      await page.getByRole("button", { name: "Complete sale" }).click();
      await page
        .getByText(/Cash sale saved on this device/)
        .first()
        .waitFor();
      await page.getByText(/1 pending sale/).waitFor();
      assert.equal(
        (await db.query("SELECT count(*)::int n FROM sales")).rows[0].n,
        0,
        "Sale reached the server while offline",
      );
      await page.screenshot({
        path: path.join(output, "offline-sale-saved.png"),
        fullPage: true,
      });
    },
  );

  await check(
    "saved sale survives an offline reload of the POS address",
    async () => {
      await page.reload();
      await page.getByRole("heading", { name: /Prepared register/ }).waitFor();
      await page.getByText(/1 pending sale/).waitFor();
      await page.screenshot({
        path: path.join(output, "offline-reload.png"),
        fullPage: true,
      });
    },
  );

  await check(
    "reconnecting syncs the sale once with its original time and price",
    async () => {
      await cashier.setOffline(false);
      await page.getByRole("button", { name: "Sync now" }).click();
      await page.getByText(/0 pending sales/).waitFor({ timeout: 30000 });
      const sales = (
        await db.query(
          "SELECT s.total_amount::text total, s.payment_kind, s.occurred_at, s.created_at, t.status FROM sales s JOIN pos_offline_transactions t ON t.sale_id = s.id",
        )
      ).rows;
      assert.equal(sales.length, 1);
      assert.equal(Number(sales[0].total), Number(product.price));
      assert.equal(sales[0].payment_kind, "CASH");
      assert.equal(sales[0].status, "ACKNOWLEDGED");
      assert(
        sales[0].occurred_at < sales[0].created_at,
        "Sale time should be when the cashier recorded it",
      );
      await page.getByRole("button", { name: "Sync now" }).click();
      await page.waitForTimeout(1500);
      assert.equal(
        (await db.query("SELECT count(*)::int n FROM sales")).rows[0].n,
        1,
        "Repeated sync duplicated the sale",
      );
    },
  );

  await check(
    "cashier finalizes the register so the shift can close",
    async () => {
      await page.getByRole("button", { name: "Finalize register" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Finalize register" })
        .click();
      await until(
        async () =>
          (await db.query("SELECT status FROM pos_offline_sessions")).rows[0]
            .status === "FINALIZED",
        "Session was not finalized",
      );
      await page.screenshot({
        path: path.join(output, "finalized.png"),
        fullPage: true,
      });
    },
  );

  await check("no page errors", async () => assert.deepEqual(pageErrors, []));
})()
  .catch(async (error) => {
    console.error(error);
    await cashierPage
      ?.screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(() => undefined);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    await db.end();
  });
