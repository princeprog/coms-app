// Stock Items and Suppliers directories against the loopback-only simulated API.
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
const outputDirectory = path.join(root, "test-results", "catalog-directories");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
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
    `Catalog directory overflows at ${width}px: ${JSON.stringify(size)}`,
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
      stockItemCount: 26,
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

    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    for (const config of [
      {
        route: "/suppliers",
        title: "Suppliers",
        item: "supplier",
        name: "North Farm Supply",
        search: "North Farm",
        heading: "Supplier directory",
      },
      {
        route: "/stock-items",
        title: "Stock Items",
        item: "stock item",
        name: "Flour",
        search: "Flour",
        heading: "Stock item directory",
      },
    ]) {
      const searchBox = page.getByRole("searchbox", {
        name: `Search ${config.title.toLowerCase()}`,
      });
      const status = page.getByRole("combobox", {
        name: "Status",
        exact: true,
      });
      const table = page.getByRole("table", {
        name: config.title,
        exact: true,
      });
      const ready = async () => {
        await page
          .getByRole("heading", { name: config.heading, exact: true })
          .waitFor();
        await table.waitFor();
      };
      await page.goto(`${baseUrl}${config.route}`, {
        waitUntil: "domcontentloaded",
      });
      await ready();
      assert.equal(
        await page.getByRole("button", { name: "Apply filters" }).count(),
        0,
      );
      for (const theme of ["light", "dark"]) {
        await page.emulateMedia({ colorScheme: theme });
        await page.waitForFunction(
          (dark) =>
            document.documentElement.classList.contains("dark") === dark,
          theme === "dark",
        );
        for (const width of [195, 390, 768, 1440, 1920]) {
          await assertNoDocumentOverflow(page, width);
          await page.screenshot({
            path: path.join(
              outputDirectory,
              `${config.route.slice(1)}-${theme}-${width}.png`,
            ),
            fullPage: true,
            animations: "disabled",
          });
          if (width === 390) {
            const geometry = await page
              .getByRole("region", { name: `${config.title} table` })
              .evaluate((element) => ({
                client: element.clientWidth,
                scroll: element.scrollWidth,
              }));
            assert(
              geometry.scroll <= geometry.client + 1,
              `${config.title} table should fit at phone width: ${JSON.stringify(geometry)}`,
            );
            if (config.item === "stock item") {
              const unitsFit = await table
                .locator("tbody tr")
                .evaluateAll((rows) =>
                  rows.every((row) => {
                    const unit = row.cells[2].querySelector("span");
                    return (
                      unit.getBoundingClientRect().height <=
                      Number.parseFloat(getComputedStyle(unit).lineHeight) + 1
                    );
                  }),
                );
              assert(
                unitsFit,
                "Stock item units should stay on one line at phone width",
              );
            }
          }
        }
      }
      await page.emulateMedia({ colorScheme: "light" });
      await page.setViewportSize({ width: 1440, height: 960 });
      const trigger = page.getByRole("button", {
        name: `More actions for ${config.name}`,
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("menuitem", { name: "View details", exact: true })
        .waitFor();
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        (element) => document.activeElement === element,
        await trigger.elementHandle(),
      );
      assert(
        await trigger.evaluate((element) => element === document.activeElement),
      );
      await trigger.click();
      await page
        .getByRole("menuitem", { name: "View details", exact: true })
        .click();
      await page
        .getByRole("dialog", {
          name: `${config.item[0].toUpperCase() + config.item.slice(1)} details`,
        })
        .waitFor();
      await page.keyboard.press("Escape");
      await trigger.click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      await page
        .getByRole("dialog", { name: `Edit ${config.item}`, exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await trigger.click();
      await page
        .getByRole("menuitem", { name: "Deactivate", exact: true })
        .click();
      await page
        .getByRole("alertdialog", { name: `Deactivate ${config.name}?` })
        .waitFor();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page
        .getByRole("button", { name: `Add ${config.item}`, exact: true })
        .click();
      await page
        .getByRole("dialog", { name: `Create ${config.item}`, exact: true })
        .waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("link", { name: "Next page", exact: true }).click();
      await page.waitForURL(
        (url) =>
          url.pathname === config.route && url.searchParams.get("page") === "2",
      );
      await page
        .getByText(`Showing 26–26 of 26 ${config.item}s`, { exact: true })
        .waitFor();
      let releaseSearch;
      const searchGate = new Promise((resolve) => {
        releaseSearch = resolve;
      });
      const delayedSearch = async (route) => {
        await searchGate;
        await route.continue();
      };
      const searchRequest = (url) =>
        url.pathname === config.route &&
        url.searchParams.get("search") === config.search;
      await page.route(searchRequest, delayedSearch);
      await searchBox.fill(config.search);
      await page.waitForTimeout(150);
      assert.equal(
        new URL(page.url()).searchParams.get("search"),
        null,
        "Search must debounce",
      );
      await page
        .getByRole("status")
        .filter({ hasText: `Updating ${config.title.toLowerCase()}` })
        .waitFor();
      assert.equal(
        await table.getByRole("row").count(),
        2,
        "Previous page remains visible during refresh",
      );
      releaseSearch();
      await page.waitForURL(
        (url) =>
          url.searchParams.get("search") === config.search &&
          !url.searchParams.has("page"),
      );
      await table.getByRole("row", { name: new RegExp(config.name) }).waitFor();
      await page.unroute(searchRequest, delayedSearch);
      assert.equal(await table.getByRole("row").count(), 2);
      await status.click();
      await page.getByRole("option", { name: "Inactive", exact: true }).click();
      await page.waitForURL(
        (url) =>
          url.searchParams.get("is_active") === "false" &&
          url.searchParams.get("search") === config.search,
      );
      await page
        .getByText(`No ${config.title.toLowerCase()} found`, { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Remove status: Inactive", exact: true })
        .click();
      await page.waitForURL(
        (url) =>
          !url.searchParams.has("is_active") &&
          url.searchParams.get("search") === config.search,
      );
      await table.waitFor();
      await page
        .getByRole("button", { name: "Clear all", exact: true })
        .click();
      await page.waitForURL(
        (url) => url.pathname === config.route && !url.search,
      );
      await table.waitFor();
      await searchBox.fill("No match for this fixture");
      await page.keyboard.press("Enter");
      await page.waitForURL(
        (url) => url.searchParams.get("search") === "No match for this fixture",
      );
      await page
        .getByRole("link", { name: "Clear filters", exact: true })
        .click();
      await page.waitForURL(
        (url) => url.pathname === config.route && !url.search,
      );
      await ready();
      await page.goto(
        `${baseUrl}${config.route}?page=999&search=Fixture&is_active=true`,
        { waitUntil: "domcontentloaded" },
      );
      await page.waitForURL(
        (url) =>
          url.pathname === config.route &&
          url.searchParams.get("search") === "Fixture" &&
          url.searchParams.get("is_active") === "true" &&
          !url.searchParams.has("page"),
      );
      await ready();
      const failure = await fetch(`${fixture.baseUrl}/__fixture/fail-next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET",
          path: config.route,
          status: 503,
          message: "Temporary catalog failure.",
        }),
      });
      assert.equal(failure.status, 204);
      await page.goto(
        `${baseUrl}${config.route}?search=Fixture&is_active=true`,
        { waitUntil: "domcontentloaded" },
      );
      await page
        .getByRole("heading", {
          name: `Unable to load ${config.title.toLowerCase()}`,
          exact: true,
        })
        .waitFor();
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await ready();
      assert.equal(new URL(page.url()).searchParams.get("search"), "Fixture");
      assert.equal(new URL(page.url()).searchParams.get("is_active"), "true");
      console.log(
        `PASS ${config.title}: light/dark five-width layouts, phone table fit, keyboard row menus, create/edit/details/deactivation confirmation, debounce/pending/status/chips, page reset/range, invalid-page recovery and load-error retry`,
      );
    }
    assert.deepEqual(browserErrors, []);
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
