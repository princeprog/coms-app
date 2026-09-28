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

async function assertNoDocumentOverflow(page, width) {
  await page.setViewportSize({ width, height: 960 });
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

    await page.getByRole("region", { name: "Operational summary" }).waitFor();
    await page.getByText("Sales trend", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Loading dashboard").count(), 0);
    assert.equal(await page.getByRole("combobox", { name: "Location" }).count(), 0);
    assert.equal(
      await page.getByRole("region", { name: "Branch performance table" }).count(),
      0,
      "A branch-only Dashboard must not show cross-branch comparison",
    );
    await page
      .getByText("Operational performance", { exact: false })
      .waitFor();
    assert.equal(await page.getByText("Manila North", { exact: true }).count(), 1);

    await page.goto(
      `${baseUrl}/dashboard?branch_id=10000000-0000-4000-8000-000000000002`,
      { waitUntil: "domcontentloaded" },
    );
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
    assert.equal(await page.getByRole("region", { name: "Operational summary" }).count(), 0);

    await page.goto(`${baseUrl}/inventory`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Inventory", level: 2 }).waitFor();
    await page
      .getByText("Stock balances and recent movements for Manila North.")
      .waitFor();
    assert.equal(
      await page.getByRole("navigation", { name: "Inventory scope" }).count(),
      0,
    );
    assert.equal(
      await page.getByRole("combobox", { name: "Branch" }).count(),
      0,
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
    await assertNoDocumentOverflow(page, 390);
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
    assert.deepEqual(browserErrors, []);
    console.log(
      "PASS branch Dashboard shows its assigned location, omits global filters, and rejects an unassigned branch URL",
    );
    console.log(
      "PASS branch-only Inventory view, search, and 195/390px reflow",
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
