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
const output = path.join(root, "test-results/receiving-ui");
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

async function checkLayout(width) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  assert(
    dimensions.content <= dimensions.width + 1,
    `Page overflows at ${width}px: ${JSON.stringify(dimensions)}`,
  );
  await page
    .getByRole("heading", { name: "Supplier Receiving", level: 2 })
    .waitFor();
  await page.getByRole("searchbox", { name: "Search supplier" }).waitFor();
}

async function chooseDate(label, day) {
  await page.getByRole("button", { name: new RegExp(`^${label}:`) }).click();
  await page.getByRole("combobox", { name: /month/i }).selectOption("8");
  await page.getByRole("combobox", { name: /year/i }).selectOption("2026");
  await page
    .getByRole("button", {
      name: new RegExp(`September ${day}(?:th|st|nd|rd)?,`),
    })
    .click();
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    authUser: {
      ...seed.user,
      role: {
        ...seed.user.role,
        code: "COMMISSARY_MANAGER",
        name: "Commissary Manager",
        isSystem: false,
      },
    },
  });
  const state = await (
    await fetch(`${fixture.baseUrl}/__fixture/state`)
  ).json();
  state.receipts.sort(
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
  await page.goto(`${baseUrl}/receipts`);
  await page.getByRole("table", { name: "Supplier deliveries" }).waitFor();

  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.waitForFunction(
      (value) => document.documentElement.classList.contains(value),
      theme,
    );
    for (const width of [195, 390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 960 });
      await checkLayout(width);
      await page.screenshot({
        path: path.join(output, `${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  console.log("PASS receiving layout at five widths in light and dark themes");
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page
    .getByText("Showing 1–25 of 26 deliveries", { exact: true })
    .waitFor();
  const actions = page.getByRole("button", { name: /^Actions for/ }).first();
  await actions.focus();
  await page.keyboard.press("Enter");
  const detail = page.getByRole("menuitem", { name: "View delivery" });
  await detail.waitFor();
  assert.equal(
    await detail.getAttribute("href"),
    `/receipts/${state.receipts[0].id}`,
  );
  assert.equal(await page.getByRole("menuitem").count(), 1);
  await page.keyboard.press("Escape");
  await detail.waitFor({ state: "hidden" });
  await page.waitForFunction(
    (element) => document.activeElement === element,
    await actions.elementHandle(),
  );
  assert(
    await actions.evaluate((element) => document.activeElement === element),
  );
  await actions.press("Enter");
  await detail.click();
  await page.waitForURL(`**/receipts/${state.receipts[0].id}`);
  await page
    .getByRole("heading", { name: "Supplier delivery record" })
    .waitFor();
  await page.getByRole("link", { name: "Back to supplier receiving" }).click();
  await page.waitForURL("**/receipts");
  await page.getByRole("link", { name: "Next page", exact: true }).click();
  await page.waitForURL("**/receipts?page=2");
  await page
    .getByText("Showing 26–26 of 26 deliveries", { exact: true })
    .waitFor();
  assert(await page.getByRole("button", { name: "Next page" }).isDisabled());
  const search = page.getByRole("searchbox", { name: "Search supplier" });
  await search.fill(state.receipts[0].supplier_name);
  // Wait for the debounced search without submitting a form.
  await page.waitForURL(
    (url) =>
      url.searchParams.get("search") === state.receipts[0].supplier_name &&
      !url.searchParams.has("page"),
  );
  await page.getByRole("link", { name: "Clear supplier search" }).waitFor();
  const matchingRows = state.receipts.filter(
    (record) => record.supplier_name === state.receipts[0].supplier_name,
  ).length;
  assert.equal(
    await page
      .getByRole("table", { name: "Supplier deliveries" })
      .locator("tbody tr")
      .count(),
    matchingRows,
  );
  await page.getByRole("link", { name: "Clear supplier search" }).click();
  await page.waitForURL("**/receipts");
  assert.equal(await search.inputValue(), "");
  await search.fill("No matching fixture supplier");
  await page.waitForURL(
    (url) => url.searchParams.get("search") === "No matching fixture supplier",
  );
  await page
    .getByText("No supplier receipts match these filters.", { exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(output, "no-results.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Clear supplier search" }).click();
  await page.waitForURL("**/receipts");
  console.log(
    "PASS keyboard row actions, detail navigation, pagination, search reset, and no-results recovery",
  );

  await page
    .getByRole("button", { name: "Record supplier delivery", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Record supplier delivery" });
  await dialog.waitFor();
  await page
    .getByRole("button", { name: "Close Record supplier delivery" })
    .click();
  await dialog.waitFor({ state: "detached" });
  await page.goto(`${baseUrl}/receipts?create=1`);
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await page.waitForURL((url) => !url.searchParams.has("create"));
  console.log("PASS existing delivery entry and quick-create navigation");

  await page.getByRole("button", { name: /^Filters/ }).click();
  await chooseDate("Delivery from", 15);
  await page.waitForURL(
    (url) => url.searchParams.get("received_from") === "2026-09-15",
  );
  await chooseDate("Delivery to", 20);
  await page.waitForURL(
    (url) => url.searchParams.get("received_to") === "2026-09-20",
  );
  await page
    .getByText("Showing 1–6 of 6 deliveries", { exact: true })
    .waitFor();
  await page.getByLabel("Minimum total cost").fill("200");
  await page.getByLabel("Minimum total cost").press("Tab");
  await page.waitForURL((url) => url.searchParams.get("min_cost") === "200");
  await page
    .getByText("No supplier receipts match these filters.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await page.waitForURL("**/receipts");
  await page.getByRole("combobox", { name: "Sort by" }).click();
  await page
    .getByRole("option", { name: "Oldest delivery", exact: true })
    .click();
  await page.waitForURL("**/receipts?sort=oldest");
  assert.match(
    await page
      .getByRole("button", { name: /^Actions for/ })
      .first()
      .getAttribute("aria-label"),
    /2026-09-01/,
  );
  console.log(
    "PASS date and total-cost filters, filter removal, and server sorting",
  );

  await page
    .getByRole("button", { name: "Record supplier delivery", exact: true })
    .click();
  await chooseDate("Delivery date", 24);
  await dialog.getByLabel("Quantity received for line 1").fill("1.25");
  await dialog.getByLabel("Unit cost for line 1").fill("2.50");
  await dialog.getByText("Total cost: 3.125", { exact: true }).waitFor();
  for (const width of [195, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: width <= 390 ? 667 : 960 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Delivery modal overflow at ${width}`,
    );
    await dialog.getByRole("button", { name: "Review delivery" }).waitFor();
    await page.screenshot({
      path: path.join(output, `delivery-modal-${width}.png`),
      fullPage: true,
    });
  }
  await dialog.getByRole("button", { name: "Review delivery" }).click();
  await page
    .getByRole("alertdialog", { name: "Review supplier delivery" })
    .waitFor();
  await page.getByRole("button", { name: "Back to delivery" }).click();
  assert(
    await dialog
      .getByRole("button", { name: /Delivery date: September 24/ })
      .isVisible(),
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
  console.log(
    "PASS shadcn delivery picker, exact total, responsive modal, and review/back preservation",
  );

  await page.goto(`${baseUrl}/dispatches`);
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    for (const width of [195, 390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 960 });
      await page.getByRole("searchbox", { name: "Search branch" }).waitFor();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Dispatch list overflow at ${width}`,
      );
      if (width === 390) {
        const deliveries = page.getByRole("region", { name: "Dispatches table" });
        assert(
          await deliveries.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          "Phone delivery rows should fit without horizontal scrolling",
        );
        const firstRow = page.getByRole("table", { name: "Dispatches", exact: true }).locator("tbody tr").first();
        assert(await firstRow.getByText(/\d+ stock items?/).isVisible(), "Phone rows must retain stock item counts");
        assert(await firstRow.getByRole("button", { name: /^Actions for/ }).isVisible(), "Phone rows must retain their action menu");
        const clippedBadges = await deliveries.locator('[data-slot="badge"]').evaluateAll((badges) => badges.flatMap((badge) => {
          const bounds = badge.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return [];
          const text = document.createRange();
          text.selectNodeContents(badge);
          const content = text.getBoundingClientRect();
          return content.top < bounds.top - 1 || content.bottom > bounds.bottom + 1 ? [badge.textContent] : [];
        }));
        assert.deepEqual(clippedBadges, [], "Wrapped delivery status labels must remain fully visible");
      }
      await page.screenshot({
        path: path.join(output, `dispatch-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 960 });
  const branchSearch = state.dispatches.find(
    (row) => row.status === "IN_TRANSIT",
  ).branch_name;
  await page
    .getByRole("searchbox", { name: "Search branch" })
    .fill(branchSearch);
  await page.waitForURL(
    (url) => url.searchParams.get("search") === branchSearch,
  );
  await page.getByRole("combobox", { name: "Dispatch status" }).click();
  await page.getByRole("option", { name: "In transit", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.searchParams.get("status") === "IN_TRANSIT" &&
      url.searchParams.get("search") === branchSearch,
  );
  const expectedDispatches = state.dispatches.filter(
    (row) => row.branch_name === branchSearch && row.status === "IN_TRANSIT",
  );
  assert.equal(
    await page
      .getByRole("table", { name: "Dispatches", exact: true })
      .locator("tbody tr")
      .count(),
    Math.min(25, expectedDispatches.length),
  );
  const dispatchActions = page
    .getByRole("button", { name: /^Actions for/ })
    .first();
  await dispatchActions.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "View dispatch" }).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (element) => document.activeElement === element,
    await dispatchActions.elementHandle(),
  );
  assert(
    await dispatchActions.evaluate(
      (element) => document.activeElement === element,
    ),
  );
  await page.getByRole("combobox", { name: "Sort by" }).click();
  await page.getByRole("option", { name: "Oldest first", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.searchParams.get("sort") === "oldest" &&
      url.searchParams.get("status") === "IN_TRANSIT",
  );
  console.log(
    "PASS responsive dispatch directory, debounced branch search, immediate status, sorting, and keyboard row menu",
  );
  await page
    .getByRole("button", { name: "Create dispatch", exact: true })
    .click();
  const dispatchModal = page.getByRole("dialog", { name: "Create dispatch" });
  const stockBounds = await dispatchModal
    .getByRole("combobox", { name: "Stock item 1", exact: true })
    .boundingBox();
  const quantityBounds = await dispatchModal
    .getByLabel("Quantity", { exact: true })
    .boundingBox();
  assert(
    Math.abs(stockBounds.y - quantityBounds.y) < 2,
    "Dispatch stock and quantity inputs should align",
  );
  await page.screenshot({
    path: path.join(output, "dispatch-modal-desktop.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 667 });
  for (let index = 0; index < 7; index++)
    await dispatchModal
      .getByRole("button", { name: "Add stock item", exact: true })
      .click();
  assert(
    await dispatchModal.evaluate((element) => {
      const header = element.querySelector('[data-slot="dialog-header"]');
      const body = element.querySelector('form > [data-slot="field-group"]');
      body.scrollTop = body.scrollHeight;
      return (
        header.getBoundingClientRect().top >=
          element.getBoundingClientRect().top && body.scrollTop > 0
      );
    }),
    "Dispatch modal must keep its header visible while the body scrolls",
  );
  await page.screenshot({
    path: path.join(output, "dispatch-modal-mobile.png"),
    animations: "disabled",
  });
  await dispatchModal
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Discard details", exact: true })
    .click();
  await dispatchModal.waitFor({ state: "detached" });
  console.log("PASS dispatch modal alignment and contained scrolling");
  assert.deepEqual(errors, [], "Browser reported console or page errors");

  await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "GET",
      path: "/supplier-receipts",
      status: 503,
      message: "Simulated receiving outage",
    }),
  });
  await page.goto(`${baseUrl}/receipts`);
  await page
    .getByText(
      "COMS could not load supplier receipts. Try again in a moment.",
      { exact: true },
    )
    .waitFor();
  assert.equal(
    await page.getByRole("table", { name: "Supplier deliveries" }).count(),
    0,
  );
  await page.screenshot({
    path: path.join(output, "load-error.png"),
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("table", { name: "Supplier deliveries" }).waitFor();
  console.log(
    "PASS load-error state and recovery; screenshots in test-results/receiving-ui",
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
