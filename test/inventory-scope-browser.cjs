// Inventory scope switching against the loopback-only simulated API fixture.
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
const outputDirectory = path.join(root, "test-results", "inventory-scope");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
const branchId = "10000000-0000-4000-8000-000000000001";
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
      authUser: seed.user,
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
      .fill(seed.user.email);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(seed.login.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.waitForURL("**/dashboard");

    await page.goto(`${baseUrl}/inventory`, { waitUntil: "domcontentloaded" });
    await page.getByRole("region", { name: "Stock balances table" }).waitFor();
    const commissary = page.getByRole("button", { name: "Commissary", exact: true });
    const branches = page.getByRole("button", { name: "Branches", exact: true });
    const branchSelect = page.getByRole("combobox", { name: "Branch", exact: true });
    assert.equal(await commissary.getAttribute("aria-pressed"), "true");
    assert.equal(await branchSelect.count(), 0);
    assert((await commissary.boundingBox()).height >= 44);
    await commissary.click();
    assert.equal(await commissary.getAttribute("aria-pressed"), "true", "Selected location cannot be cleared");
    await branches.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("scope") === "BRANCH" && url.searchParams.get("branch_id") === branchId);
    await branchSelect.waitFor();
    assert.equal(await branches.getAttribute("aria-pressed"), "true");
    const currentBranchName = await branchSelect.innerText();
    await branchSelect.focus();
    await page.keyboard.press("Enter");
    const options = page.getByRole("option");
    await options.first().waitFor();
    const alternative = await options.evaluateAll((items, current) => items.map(item => item.textContent.trim()).find(text => text && !current.includes(text)), currentBranchName);
    assert(alternative, "Fixture must contain another selectable branch");
    await page.getByRole("option", { name: alternative, exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("scope") === "BRANCH" && url.searchParams.get("branch_id") !== branchId);
    await page.waitForFunction(name => document.querySelector('#inventory-branch')?.textContent.includes(name), alternative);
    await page.goBack();
    await page.waitForURL((url) => url.searchParams.get("branch_id") === branchId);
    await page.waitForFunction(() => document.querySelector('#inventory-branch')?.textContent.includes('Manila North'));
    await page.goBack();
    await page.waitForURL((url) => !url.search);
    await branchSelect.waitFor({ state: "detached" });
    assert.equal(await commissary.getAttribute("aria-pressed"), "true");
    await page.goForward();
    await branchSelect.waitFor();
    assert.equal(await branches.getAttribute("aria-pressed"), "true");
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: "Active", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("status") === "active");
    await commissary.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL((url) => url.searchParams.get("scope") === "COMMISSARY" && url.searchParams.get("status") === "active" && !url.searchParams.has("branch_id"));
    await branchSelect.waitFor({ state: "detached" });
    for (const scope of ["COMMISSARY", "BRANCH"]) {
      if (scope === "BRANCH") {
        await branches.click();
        await branchSelect.waitFor();
      }
      for (const theme of ["light", "dark"]) {
        await page.emulateMedia({ colorScheme: theme });
        await page.waitForFunction(dark => document.documentElement.classList.contains("dark") === dark, theme === "dark");
        for (const width of [195, 390, 768, 1440, 1920]) {
          await assertNoDocumentOverflow(page, width);
          assert.equal(await branchSelect.count(), scope === "BRANCH" ? 1 : 0);
          await page.screenshot({ path: path.join(outputDirectory, `${scope.toLowerCase()}-${theme}-${width}.png`), fullPage: true, animations: "disabled" });
        }
      }
    }
    assert.deepEqual(browserErrors, []);
    console.log("PASS Inventory large scope controls, conditional branch selector, branch selection, keyboard, URL history/filter preservation and five-width light/dark reflow");
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
