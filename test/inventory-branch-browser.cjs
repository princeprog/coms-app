// Production Inventory view for a branch-only account against the loopback fixture.
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
  fs.readFileSync(path.join(__dirname, "fixtures", "operational-api.json")),
);
const outputDirectory = path.join(root, "test-results", "inventory-branch");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
const branchId = "10000000-0000-4000-8000-000000000001";
const branchRole = seed.roles.find((role) => role.code === "BRANCH_MANAGER");
assert(branchRole, "Fixture requires a Branch Manager role");
const branchUser = {
  ...seed.user,
  email: "branch-manager@example.test",
  full_name: "Fixture Branch Manager",
  role: {
    id: branchRole.id,
    code: branchRole.code,
    name: branchRole.role_name,
    isSystem: false,
    isActive: true,
  },
  permissions: branchRole.permission_keys,
  branch_ids: [branchId],
};

function getFreePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close((error) =>
        error ? reject(error) : resolve(address.port),
      );
    });
  });
}

async function waitForServer(url, server, getOutput) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before ready.\n${getOutput()}`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not become ready.\n${getOutput()}`);
}

async function assertNoDocumentOverflow(page, width, height = 960) {
  await page.setViewportSize({ width, height });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const size = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(
    size.scroll <= size.client + 1,
    `Inventory overflows at ${width}px: ${JSON.stringify(size)}`,
  );
}

(async () => {
  let fixture;
  let server;
  let browser;
  let serverOutput = "";
  const browserErrors = [];
  try {
    fs.mkdirSync(outputDirectory, { recursive: true });
    fixture = await createOperationalApiFixture({
      gatewaySecret,
      authUser: branchUser,
      stockItemCount: 8,
    });
    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    server = spawn(
      process.execPath,
      [
        path.join(root, "node_modules", "next", "dist", "bin", "next"),
        "start",
        "-p",
        String(port),
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
    for (const stream of [server.stdout, server.stderr]) {
      stream.on("data", (chunk) => {
        serverOutput = (serverOutput + chunk.toString()).slice(-8_000);
      });
    }
    await waitForServer(baseUrl, server, () => serverOutput);

    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1586, height: 992 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(branchUser.email);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(seed.login.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForURL("**/dashboard");

    await page
      .getByRole("heading", { name: "Dashboard", exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole("combobox", { name: "Location" }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Branch performance table" })
        .count(),
      0,
      "A branch-only Dashboard must not show cross-branch comparison",
    );

    await page.goto(`${baseUrl}/inventory`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Inventory", level: 2 }).waitFor();
    await page
      .getByText("Stock balances and recent movements for Manila North.")
      .waitFor();
    assert(await page.getByRole("button", { name: "Commissary", exact: true }).isDisabled());
    assert.equal(await page.getByRole("button", { name: "Branches", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(
      await page.getByRole("combobox", { name: "Branch" }).count(),
      1,
    );
    assert.equal(
      await page.getByRole("combobox", { name: "Status" }).count(),
      1,
    );
    assert.equal(
      await page.getByRole("combobox", { name: "Category" }).count(),
      1,
    );
    assert.equal(
      await page.getByRole("columnheader", { name: "Actions" }).count(),
      0,
    );
    assert.equal(
      await page.getByRole("button", { name: /Actions for/ }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Stock balances table" })
        .getByRole("row")
        .count(),
      9,
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Recent inventory movements table" })
        .getByRole("row")
        .count(),
      9,
    );
    await page.screenshot({
      path: path.join(outputDirectory, "inventory-branch-desktop.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoDocumentOverflow(page, 390, 667);
    for (const width of [195, 390, 768, 1440, 1920]) {
      await assertNoDocumentOverflow(page, width);
      if (width === 390) {
        for (const name of ["Stock balances table", "Recent inventory movements table"]) {
          assert(await page.getByRole("region", { name }).evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${name} should fit phone width without horizontal scrolling`);
        }
      }
      await page.screenshot({ path: path.join(outputDirectory, `inventory-light-${width}.png`), fullPage: true, animations: "disabled" });
    }
    await assertNoDocumentOverflow(page, 390, 667);
    await page.screenshot({
      path: path.join(outputDirectory, "inventory-branch-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    await assertNoDocumentOverflow(page, 195);

    const search = page.getByRole("searchbox", { name: "Search stock items" });
    await search.fill("Flour");
    await search.press("Enter");
    await page.waitForURL(
      (url) =>
        url.pathname === "/inventory" &&
        url.searchParams.get("scope") === "BRANCH" &&
        url.searchParams.get("branch_id") === branchId &&
        url.searchParams.get("search") === "Flour",
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Stock balances table" })
        .getByRole("row")
        .count(),
      2,
    );
    const balanceRows = page
      .getByRole("region", { name: "Stock balances table" })
      .getByRole("row");
    const movementRows = page
      .getByRole("region", { name: "Recent inventory movements table" })
      .getByRole("row");
    const statusFilter = page.getByRole("combobox", { name: "Status" });
    await statusFilter.click();
    await page.getByRole("option", { name: "Inactive" }).click();
    await page.waitForURL(
      (url) =>
        url.searchParams.get("status") === "inactive" &&
        url.searchParams.get("search") === "Flour",
    );
    await page.getByText("No stock items match these filters.").waitFor();
    assert.equal(await balanceRows.count(), 0);
    assert.equal(await movementRows.count(), 9);

    const categoryFilter = page.getByRole("combobox", { name: "Category" });
    await categoryFilter.click();
    await page.getByRole("option", { name: "Dry goods" }).click();
    await page.waitForURL(
      (url) =>
        url.searchParams.get("status") === "inactive" &&
        url.searchParams.get("category") === "Dry goods",
    );
    assert.equal(await balanceRows.count(), 0);
    assert.equal(
      await movementRows.count(),
      9,
      "Stock-item filters must not filter recent movements",
    );

    const filteredSearch = page.getByRole("searchbox", {
      name: "Search stock items",
    });
    await filteredSearch.fill("Dry goods");
    await page.waitForURL(
      (url) =>
        url.searchParams.get("search") === "Dry goods" &&
        url.searchParams.get("category") === "Dry goods",
    );
    await page
      .getByRole("region", { name: "Stock balances table" })
      .getByRole("row", { name: /Fixture Stock Item 03/ })
      .waitFor();
    assert.equal(await balanceRows.count(), 2);
    assert.equal(await movementRows.count(), 9);

    await filteredSearch.fill("No matching item");
    await page.waitForURL(
      (url) => url.searchParams.get("search") === "No matching item",
    );
    await page.getByText("No stock items match these filters.").waitFor();
    await page.getByRole("button", { name: "Clear filters" }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/inventory" &&
        url.searchParams.get("scope") === "BRANCH" &&
        url.searchParams.get("branch_id") === branchId &&
        [...url.searchParams.keys()].length === 2,
    );
    await page
      .getByRole("region", { name: "Stock balances table" })
      .getByRole("row", { name: /Flour/ })
      .waitFor();
    assert.equal(await balanceRows.count(), 9);

    await statusFilter.click();
    await page.getByRole("option", { name: "Inactive", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("status") === "inactive");
    await categoryFilter.click();
    await page.getByRole("option", { name: "Dry goods", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("category") === "Dry goods");
    await filteredSearch.fill("Dry goods");
    await page.waitForURL((url) => url.searchParams.get("search") === "Dry goods");
    await page.getByRole("button", { name: "Remove Status: Inactive", exact: true }).click();
    await page.waitForURL((url) => !url.searchParams.has("status") && url.searchParams.get("category") === "Dry goods" && url.searchParams.get("search") === "Dry goods" && url.searchParams.get("branch_id") === branchId && !url.searchParams.has("page"));
    assert.equal(await movementRows.count(), 9, "Removing a balance filter must not change ledger scope");
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("scope") === "BRANCH" && url.searchParams.get("branch_id") === branchId && [...url.searchParams.keys()].length === 2);
    await page.getByRole("region", { name: "Stock balances table" }).getByRole("row", { name: /Flour/ }).waitFor();
    assert.equal(await balanceRows.count(), 9);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("dark"),
    );
    await assertNoDocumentOverflow(page, 390, 667);
    await page.screenshot({
      path: path.join(outputDirectory, "inventory-branch-dark-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    for (const width of [195, 390, 768, 1440, 1920]) {
      await assertNoDocumentOverflow(page, width);
      await page.screenshot({ path: path.join(outputDirectory, `inventory-dark-${width}.png`), fullPage: true, animations: "disabled" });
    }
    assert.deepEqual(browserErrors, []);
    console.log(
      "PASS branch-only Dashboard omits global location filters and cross-branch comparisons",
    );
    console.log(
      "PASS branch-only Inventory filters, ledger scope, dark mode, and 195/390px reflow",
    );
    console.log(`Captured ${outputDirectory}`);
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once("exit", resolve));
    }
    if (fixture) await fixture.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
