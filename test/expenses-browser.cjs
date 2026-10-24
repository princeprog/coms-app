// Run only after a production build. Uses fixture auth/data on isolated loopback ports.
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
const { user } = require("./fixtures/operational-api.json");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "test-results", "expenses");
const secret = randomBytes(32).toString("hex");
let fixture, server, browser, page, origin;
let serverOutput = "",
  step = "startup";
const errors = [],
  completed = [];

async function freePort() {
  const listener = net.createServer();
  return new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const port = listener.address().port;
      listener.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}
async function eventually(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}
async function api(route, method = "GET", body) {
  const response = await fetch(fixture.baseUrl + route, {
    method,
    headers: {
      "x-coms-auth-gateway": secret,
      cookie: "coms_access=fixture-access-token",
      "content-type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert(response.ok, `Fixture ${method} ${route}: ${response.status}`);
  return response.json();
}
const snapshot = () => api("/expenses/__fixture/state");
async function choose(container, label, option) {
  await container.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
async function filterWith(changes) {
  await page.getByRole("button", { name: /^Filters/ }).click();
  const panel = page.locator('[data-slot="popover-content"]');
  await panel.getByText("Filter expenses", { exact: true }).waitFor();
  for (const [label, option] of changes) await choose(page, label, option);
  await panel
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await panel.waitFor({ state: "hidden" });
}
async function chooseDates(preset) {
  await page.getByRole("button", { name: /^Date range:/ }).click();
  const panel = page.locator('[data-slot="popover-content"]');
  await panel.getByRole("button", { name: preset, exact: true }).click();
  await panel.waitFor({ state: "hidden" });
}
async function go(query = "") {
  await page.goto(origin + "/expenses" + query, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("heading", { name: "Expenses", exact: true })
    .last()
    .waitFor();
  await page
    .getByRole("region", { name: "Recorded spending summary" })
    .waitFor();
}
async function toast(title) {
  const message = page.getByText(title, { exact: true });
  await message.waitFor();
  await eventually(async () => {
    const box = await message.boundingBox(),
      viewport = page.viewportSize();
    return (
      box &&
      box.y >= 0 &&
      box.y + box.height <= viewport.height &&
      box.x >= 0 &&
      box.x + box.width <= viewport.width
    );
  }, `Success toast is outside the viewport: ${title}`);
}
async function screenshot(name) {
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
    animations: "disabled",
  });
}
async function rowAction(description, action) {
  const trigger = page.getByRole("button", {
    name: `Actions for ${description}`,
    exact: true,
  });
  await trigger.waitFor();
  await trigger.click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}
async function closeDialog(dialog) {
  await dialog
    .getByRole("button", { name: "Close", exact: true })
    .first()
    .click();
  await dialog.waitFor({ state: "hidden" });
}
async function visibleRows(count) {
  await eventually(
    async () => (await page.locator("table tbody tr").count()) === count,
    `Expected ${count} visible expense rows`,
  );
}
async function noOverflow() {
  const sizes = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(
    sizes.scroll <= sizes.client + 1,
    `Document overflow: ${JSON.stringify(sizes)}`,
  );
}
async function fillExpense(dialog, location, description, amount) {
  await choose(dialog, "Location", location);
  await choose(dialog, "Category", "Transportation");
  await dialog.getByLabel("Description", { exact: true }).fill(description);
  if (amount)
    await dialog.getByLabel("Amount (PHP)", { exact: true }).fill(amount);
}
async function modalKeyboard(width) {
  await page.setViewportSize({ width, height: 960 });
  const trigger = page.getByRole("button", {
    name: "Record expense",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Record expense",
    exact: true,
  });
  await dialog.waitFor();
  await eventually(
    () =>
      dialog.evaluate((element) => element.contains(document.activeElement)),
    "Focus did not enter the expense modal",
  );
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press(index < 12 ? "Tab" : "Shift+Tab");
    assert(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
      "Keyboard focus escaped expense modal",
    );
  }
  await noOverflow();
  await screenshot(`record-keyboard-${width}`);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () => trigger.evaluate((element) => element === document.activeElement),
    "Focus did not return to Record expense",
  );
}

async function run() {
  fs.mkdirSync(output, { recursive: true });
  assert(
    fs.existsSync(path.join(root, ".next", "BUILD_ID")),
    "A completed production build is required; this script never builds.",
  );
  fixture = await createOperationalApiFixture({
    gatewaySecret: secret,
    authUser: user,
  });
  const initial = await snapshot();
  const branch = initial.locations.find((item) => item.scope === "BRANCH");
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
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
        COMS_AUTH_GATEWAY_SECRET: secret,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      serverOutput = (serverOutput + chunk).slice(-12000);
    });
  await eventually(
    async () => {
      if (server.exitCode !== null)
        throw new Error("Next exited: " + serverOutput);
      try {
        return (await fetch(origin, { redirect: "manual" })).status < 500;
      } catch {
        return false;
      }
    },
    "Production server did not start: " + serverOutput,
    45000,
  );
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  await context.addCookies([
    {
      name: "coms_access",
      value: "fixture-access-token",
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.addInitScript(() => localStorage.setItem("theme", "system"));
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  step = "initial exact purchase values and responsive layouts";
  await go();
  await visibleRows(10);
  await page
    .getByRole("navigation", { name: "Expense pagination" })
    .getByText("1–10 of 16 · Page 1 of 2", { exact: true })
    .waitFor();
  const sourceRow = page
    .getByRole("row")
    .filter({ hasText: "Supplier rice delivery" });
  await sourceRow.getByText("₱24.73", { exact: true }).waitFor();
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.waitForFunction(
      (dark) => document.documentElement.classList.contains("dark") === dark,
      theme === "dark",
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 960 });
      await noOverflow();
      await screenshot(`list-${theme}-${width}`);
    }
  }
  await page.emulateMedia({ colorScheme: "light" });
  completed.push(step);

  step = "keyboard modal focus, Escape and focus restoration";
  await modalKeyboard(390);
  await modalKeyboard(1440);
  completed.push(step);

  step =
    "create failure preserves draft and retry produces a visible success toast";
  await page
    .getByRole("button", { name: "Record expense", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Record expense",
    exact: true,
  });
  await fillExpense(dialog, branch.name, "Browser delivery fuel", "120.25");
  await dialog.getByLabel("Payee (optional)").fill("Cebu fuel station");
  await api("/expenses/__fixture/fail-next", "POST", {
    method: "POST",
    path: "/expenses",
    status: 503,
    message: "Temporary expense outage. Try again.",
  });
  await dialog
    .getByRole("button", { name: "Record expense", exact: true })
    .click();
  await dialog
    .getByRole("alert")
    .filter({ hasText: "Expenses are unavailable" })
    .waitFor();
  assert.equal(
    await dialog.getByLabel("Description", { exact: true }).inputValue(),
    "Browser delivery fuel",
  );
  assert.equal(
    await dialog.getByLabel("Amount (PHP)", { exact: true }).inputValue(),
    "120.25",
  );
  assert.equal(
    await page.getByText("Expense recorded.", { exact: true }).count(),
    0,
  );
  await screenshot("create-failure-draft");
  await dialog
    .getByRole("button", { name: "Record expense", exact: true })
    .click();
  await toast("Expense recorded.");
  await dialog.waitFor({ state: "hidden" });
  await screenshot("create-visible-toast");
  let state = await snapshot();
  const attempts = state.requests.filter(
    (entry) =>
      entry.method === "POST" &&
      entry.path === "/expenses" &&
      entry.body?.description === "Browser delivery fuel",
  );
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].key, attempts[1].key);
  assert.equal(
    state.records.filter((row) => row.description === "Browser delivery fuel")
      .length,
    1,
  );
  completed.push(step);

  step = "correction requires reason and records readable before/after history";
  await rowAction("Browser delivery fuel", "Edit expense");
  dialog = page.getByRole("dialog", { name: "Edit expense", exact: true });
  await dialog.getByLabel("Amount (PHP)", { exact: true }).fill("110.10");
  const countBefore = state.requests.filter(
    (entry) => entry.method === "PATCH",
  ).length;
  await dialog
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await eventually(
    async () =>
      (await dialog
        .getByLabel("Reason for correction")
        .getAttribute("aria-invalid")) === "true",
    "Missing correction reason was not shown",
  );
  assert.equal(
    (await snapshot()).requests.filter((entry) => entry.method === "PATCH")
      .length,
    countBefore,
  );
  await dialog
    .getByLabel("Reason for correction")
    .fill("Corrected against the fuel receipt");
  await dialog
    .getByRole("button", { name: "Save correction", exact: true })
    .click();
  await toast("Expense corrected.");
  await dialog.waitFor({ state: "hidden" });
  await rowAction("Browser delivery fuel", "View details & history");
  dialog = page.getByRole("dialog", {
    name: "Browser delivery fuel",
    exact: true,
  });
  const history = dialog.getByRole("region", { name: "Expense history" });
  await history
    .getByText("Corrected against the fuel receipt", { exact: true })
    .waitFor();
  assert.equal(await history.locator("li").count(), 2);
  await history.locator("details").last().locator("summary").click();
  await history.getByText("₱120.25 → ₱110.10", { exact: true }).waitFor();
  await screenshot("correction-history");
  await closeDialog(dialog);
  completed.push(step);

  step = "void preserves history and removes recorded spending";
  await rowAction("Browser delivery fuel", "Void expense");
  dialog = page.getByRole("dialog", { name: "Void expense?", exact: true });
  await dialog
    .getByRole("button", { name: "Void expense", exact: true })
    .click();
  await eventually(
    async () =>
      (await dialog
        .getByLabel("Reason for voiding")
        .getAttribute("aria-invalid")) === "true",
    "Void reason is required",
  );
  await dialog
    .getByLabel("Reason for voiding")
    .fill("Duplicate reimbursement entry");
  await dialog
    .getByRole("button", { name: "Void expense", exact: true })
    .click();
  await toast("Expense voided.");
  await dialog.waitFor({ state: "hidden" });
  await filterWith([["Status", "Voided"]]);
  await page.waitForURL((url) => url.searchParams.get("status") === "VOIDED");
  await rowAction("Browser delivery fuel", "View details & history");
  dialog = page.getByRole("dialog", {
    name: "Browser delivery fuel",
    exact: true,
  });
  await dialog
    .getByText("Duplicate reimbursement entry", { exact: true })
    .waitFor();
  assert.equal(
    await dialog
      .getByRole("region", { name: "Expense history" })
      .locator("li")
      .count(),
    3,
  );
  await screenshot("void-history");
  await closeDialog(dialog);
  await page
    .getByRole("button", {
      name: "Actions for Browser delivery fuel",
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .getByRole("menuitem", { name: "Edit expense", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("menuitem", { name: "Void expense", exact: true })
      .count(),
    0,
  );
  await page.keyboard.press("Escape");
  completed.push(step);

  step =
    "register lookup sets and locks exact cash-out amount without a second cash movement";
  await go();
  await page
    .getByRole("button", { name: "Record expense", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Record expense", exact: true });
  await fillExpense(dialog, branch.name, "Browser register expense");
  await choose(dialog, "Cash source", "Register cash out");
  await dialog.getByLabel("Find cash out").fill("no matching cash movement");
  await dialog.getByText(/No matching cash outs/).waitFor();
  await dialog.getByLabel("Find cash out").fill("Motorcycle");
  await dialog
    .getByRole("button", { name: /Motorcycle delivery fuel/ })
    .click();
  assert.equal(
    await dialog.getByLabel("Amount (PHP)", { exact: true }).inputValue(),
    "87.65",
  );
  assert.equal(
    await dialog.getByLabel("Amount (PHP)", { exact: true }).isDisabled(),
    true,
  );
  await screenshot("register-exact-amount");
  await dialog
    .getByRole("button", { name: "Record expense", exact: true })
    .click();
  await toast("Expense recorded.");
  await dialog.waitFor({ state: "hidden" });
  await rowAction("Browser register expense", "Edit expense");
  dialog = page.getByRole("dialog", { name: "Edit expense", exact: true });
  for (const label of ["Location", "Payment method", "Cash source"])
    assert(
      await dialog
        .getByRole("combobox", { name: label, exact: true })
        .isDisabled(),
      `${label} must remain locked`,
    );
  assert(await dialog.getByLabel("Amount (PHP)", { exact: true }).isDisabled());
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  state = await snapshot();
  assert.deepEqual(state.financialState, initial.financialState);
  assert.deepEqual(state.cashOuts, initial.cashOuts);
  const available = await api(
    `/expenses/cash-outs?branch_id=${branch.branch_id}`,
  );
  assert(!available.items.some((item) => item.id === initial.cashOuts[0].id));
  completed.push(step);

  step = "source purchases are read-only and retain source navigation";
  await go("?source=SUPPLIER_DELIVERY");
  await page
    .getByRole("button", {
      name: "Actions for Supplier rice delivery",
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .getByRole("menuitem", { name: "Edit expense", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("menuitem", { name: "Void expense", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("menuitem", { name: "View details & history", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Supplier rice delivery",
    exact: true,
  });
  await dialog.getByText(/included once at its purchase value/).waitFor();
  assert.equal(await dialog.getByRole("textbox").count(), 0);
  const supplier = initial.records.find(
    (row) => row.source === "SUPPLIER_DELIVERY",
  );
  assert.equal(
    await dialog
      .getByRole("link", { name: "View source purchase" })
      .getAttribute("href"),
    `/receipts/${supplier.id}`,
  );
  await screenshot("purchase-read-only");
  await closeDialog(dialog);
  completed.push(step);

  step = "server filters, URL pagination, sorting, dates and all-match CSV";
  await go();
  await page
    .getByLabel("Search expenses", { exact: true })
    .fill("Delivery fuel");
  await page.waitForURL(
    (url) => url.searchParams.get("search") === "Delivery fuel",
  );
  const pagination = page.getByRole("navigation", {
    name: "Expense pagination",
  });
  await pagination
    .getByText("1–10 of 14 · Page 1 of 2", { exact: true })
    .waitFor();
  const summary = await page
    .getByRole("region", { name: "Recorded spending summary" })
    .innerText();
  await pagination.getByRole("button", { name: "Next", exact: true }).click();
  await pagination
    .getByText("11–14 of 14 · Page 2 of 2", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("region", { name: "Recorded spending summary" })
      .innerText(),
    summary,
  );
  await page.reload();
  await pagination
    .getByText("11–14 of 14 · Page 2 of 2", { exact: true })
    .waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export matching CSV", exact: true })
    .click();
  const download = await downloadPromise;
  const csvPath = path.join(output, "filtered-expenses.csv");
  await download.saveAs(csvPath);
  const csv = fs.readFileSync(csvPath, "utf8");
  assert.match(csv, /Delivery fuel 01/);
  assert.match(csv, /Delivery fuel 14/);
  assert.doesNotMatch(csv, /Supplier rice delivery/);
  await choose(page, "Rows per page", "30");
  await pagination
    .getByText("1–14 of 14 · Page 1 of 1", { exact: true })
    .waitFor();
  await choose(page, "Sort by", "Highest amount");
  await page.waitForURL(
    (url) => url.searchParams.get("sort") === "amount_highest",
  );
  await eventually(
    async () =>
      (await page.locator("table tbody tr").first().innerText()).includes(
        "Delivery fuel 14",
      ),
    "Amount sorting did not reach the table",
  );
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page
    .locator('[data-slot="popover-content"]')
    .getByText("Filter expenses", { exact: true })
    .waitFor();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await noOverflow();
    await screenshot(`filters-popover-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.keyboard.press("Escape");
  await filterWith([
    ["Location", branch.name],
    ["Category", "Transportation"],
  ]);
  await page.waitForURL(
    (url) => url.searchParams.get("category_id") === initial.categories[0].id,
  );
  await page.getByRole("button", { name: /^Filters, 2 active/ }).waitFor();
  await page
    .getByRole("button", { name: `Remove Location: ${branch.name}` })
    .waitFor();
  await screenshot("filters-active-chips");
  await chooseDates("Last month");
  await page
    .getByText("No expenses in this selection", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await page.waitForURL((url) => !url.searchParams.get("category_id"));
  await chooseDates("This month");
  await choose(page, "Rows per page", "10");
  await visibleRows(10);
  completed.push(step);

  step = "category create, rename, deactivate and reactivate";
  await page
    .getByRole("link", { name: "Manage categories", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Expense categories", exact: true })
    .last()
    .waitFor();
  await page
    .getByRole("button", { name: "Create category", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Create expense category",
    exact: true,
  });
  await dialog.getByLabel("Category name").fill("Browser cleaning");
  await dialog
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await toast("Category created.");
  await dialog.waitFor({ state: "hidden" });
  await rowAction("Browser cleaning", "Rename category");
  dialog = page.getByRole("dialog", { name: "Rename category", exact: true });
  await dialog.getByLabel("Category name").fill("Browser cleaning supplies");
  await dialog
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await toast("Category renamed.");
  await dialog.waitFor({ state: "hidden" });
  for (const action of ["Deactivate", "Activate"]) {
    await rowAction("Browser cleaning supplies", `${action} category`);
    const confirmation = page.getByRole("alertdialog", {
      name: `${action} Browser cleaning supplies?`,
      exact: true,
    });
    await confirmation
      .getByRole("button", { name: `${action} category`, exact: true })
      .click();
    await toast(
      `Category ${action === "Deactivate" ? "deactivated" : "activated"}.`,
    );
    await confirmation.waitFor({ state: "hidden" });
    await page
      .getByRole("row")
      .filter({ hasText: "Browser cleaning supplies" })
      .getByText(action === "Deactivate" ? "Inactive" : "Active", {
        exact: true,
      })
      .waitFor();
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await noOverflow();
    await screenshot(`categories-${width}`);
  }
  completed.push(step);
  assert.deepEqual(errors, [], "Browser runtime or console errors");
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      { status: "passed", completed, errors, fixtureOnly: true },
      null,
      2,
    ),
  );
  console.log("PASS Expenses browser: " + completed.join("; "));
}

run()
  .catch(async (error) => {
    console.error(
      `FAIL Expenses browser step: ${step}\n${error.stack ?? error.message}`,
    );
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify(
        {
          status: "failed",
          step,
          completed,
          errors,
          error: error.message,
          fixtureOnly: true,
        },
        null,
        2,
      ),
    );
    if (page) await screenshot("failure").catch(() => {});
    if (serverOutput) console.error(serverOutput);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      const exited = new Promise((resolve) => server.once("exit", resolve));
      server.kill();
      await exited;
    }
    if (fixture) await fixture.close();
  });
