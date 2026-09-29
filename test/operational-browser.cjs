// Production UI regression against the loopback-only fake API. Never uses a real account.
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
const outputDirectory = path.join(root, "test-results", "operational-ui");
const gatewaySecret = crypto.randomBytes(32).toString("hex");
// 195 CSS pixels approximates the reflow width available at 200% zoom from 390px.
const viewportWidths = [195, 390, 768, 1440, 1920];
const browserErrors = [];
const failedResponses = [];
let fixture;
let server;
let browser;
let page;
let serverOutput = "";

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

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Next.js exited before ready.\n${serverOutput}`);
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Next.js did not become ready.\n${serverOutput}`);
}

async function navigate(pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, {
    waitUntil: "domcontentloaded",
  });
  assert(response, `No document response for ${pathname}`);
  assert(response.status() < 500, `${pathname} returned ${response.status()}`);
  await page.locator("main").waitFor();
  await page.locator("h1").waitFor();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

async function assertRoleWorkspaceScroll(width, route, searchId) {
  const visibleSearch = page
    .locator(`#${searchId}`)
    .filter({ visible: true })
    .first();
  await visibleSearch.waitFor({ state: "visible" });
  await page
    .locator(
      '[aria-label="Permission groups"] [data-slot="scroll-area-viewport"]',
    )
    .filter({ visible: true })
    .first()
    .waitFor({ state: "visible" });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const state = await page.evaluate((permissionSearchId) => {
    const search = [...document.querySelectorAll(`#${permissionSearchId}`)].find(
      (element) => element.getClientRects().length > 0,
    );
    const workspace = search?.closest("[data-role-workspace]");
    const picker = search?.closest("[data-role-permission-picker]");
    const viewport = picker?.querySelector(
      '[aria-label="Permission groups"] [data-slot="scroll-area-viewport"]',
    );
    const workspaceHeader = workspace?.querySelector(":scope > header");
    const roleTitle = workspaceHeader?.querySelector("h2");
    const detailsCard = workspace?.querySelector(
      "[data-role-workspace-details]",
    );
    const footer = workspace?.querySelector("[data-role-workspace-footer]");
    const permissionTitle = [...(workspace?.querySelectorAll("h3") ?? [])].find(
      (heading) => heading.textContent?.trim() === "Permissions",
    );
    const permissionCard = permissionTitle?.closest('[data-slot="card"]');
    if (
      !viewport ||
      !workspaceHeader ||
      !roleTitle ||
      !detailsCard ||
      !footer ||
      !search ||
      !permissionCard ||
      !permissionTitle
    )
      return null;
    const before = viewport.scrollTop;
    viewport.scrollTop = viewport.scrollHeight;
    const after = viewport.scrollTop;
    viewport.scrollTop = before;
    const viewportRect = viewport.getBoundingClientRect();
    return {
      documentHeight: document.documentElement.scrollHeight,
      windowHeight: window.innerHeight,
      contentHeight: viewport.scrollHeight,
      viewportHeight: viewport.clientHeight,
      contentWidth: viewport.scrollWidth,
      viewportWidth: viewport.clientWidth,
      permissionCardTop: permissionCard.getBoundingClientRect().top,
      permissionCardBottom: permissionCard.getBoundingClientRect().bottom,
      workspaceHeaderTop: workspaceHeader.getBoundingClientRect().top,
      workspaceHeaderBottom: workspaceHeader.getBoundingClientRect().bottom,
      roleTitleBottom: roleTitle.getBoundingClientRect().bottom,
      detailsCardTop: detailsCard.getBoundingClientRect().top,
      detailsCardBottom: detailsCard.getBoundingClientRect().bottom,
      permissionTitleTop: permissionTitle.getBoundingClientRect().top,
      permissionTitleBottom: permissionTitle.getBoundingClientRect().bottom,
      overflowingChildren: [...viewport.querySelectorAll("*")]
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          slot: element.getAttribute("data-slot"),
          className: element.className,
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width),
          text: element.textContent?.trim().slice(0, 48),
        }))
        .filter((element) => element.right > viewportRect.right + 1)
        .slice(0, 8),
      before,
      after,
      documentScroll: document.documentElement.scrollTop,
      footerBottom: footer.getBoundingClientRect().bottom,
      searchBottom: search.getBoundingClientRect().bottom,
      searchTop: search.getBoundingClientRect().top,
    };
  }, searchId);
  assert(state, `${route} scroll structure missing at ${width}px`);
  assert(
    state.documentHeight <= state.windowHeight + 2,
    `${route} document scrolls at ${width}px: ${JSON.stringify(state)}`,
  );
  assert(
    state.contentHeight > state.viewportHeight && state.after > state.before,
    `${route} permission list does not scroll at ${width}px: ${JSON.stringify(state)}`,
  );
  assert(
    state.contentWidth <= state.viewportWidth + 1,
    `${route} permission list scrolls horizontally at ${width}px: ${JSON.stringify(state)}`,
  );
  assert(
    state.searchTop >= state.permissionCardTop - 1 &&
      state.searchBottom <= state.permissionCardBottom + 1,
    `${route} permission search is clipped by its card at ${width}px: ${JSON.stringify(state)}`,
  );
  assert(
    state.viewportHeight >= 32,
    `${route} permission list is not usable at ${width}px: ${JSON.stringify(state)}`,
  );
  assert.equal(state.documentScroll, 0);
  assert(
    state.footerBottom <= state.windowHeight + 1 &&
      state.searchBottom < state.footerBottom,
    `${route} actions or permission search leave the viewport at ${width}px: ${JSON.stringify(state)}`,
  );
  assert(
    state.workspaceHeaderTop >= 0 &&
      state.roleTitleBottom <= state.windowHeight &&
      state.detailsCardTop >= state.workspaceHeaderBottom - 1 &&
      state.detailsCardBottom <= state.permissionCardBottom + 1 &&
      state.permissionTitleTop >= state.permissionCardTop &&
      state.permissionTitleBottom <= state.searchTop,
    `${route} workspace headings or details leave the viewport at ${width}px: ${JSON.stringify(state)}`,
  );
}

async function openRoleAction(roleName, actionName) {
  await page
    .getByRole("button", { name: `More actions for ${roleName}` })
    .click();
  await page.getByRole("menuitem", { name: actionName, exact: true }).click();
}

async function assertPageStructure(pathname, width, expectedDeviceScale = 1) {
  const structure = await page.evaluate(() => {
    const uncontainedOverflowers = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        let ancestor = element.parentElement;
        let contained = false;
        while (ancestor && ancestor !== document.body) {
          if (getComputedStyle(ancestor).overflowX !== "visible") {
            contained = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        return {
          tag: element.tagName.toLowerCase(),
          slot: element.getAttribute("data-slot"),
          right: Math.round(rect.right),
          text: element.textContent?.trim().slice(0, 40),
          contained,
        };
      })
      .filter(
        (element) =>
          !element.contained && element.right > window.innerWidth + 1,
      )
      .slice(0, 5);

    return {
      mainCount: document.querySelectorAll("main").length,
      h1Count: document.querySelectorAll("h1").length,
      viewportWidth: window.innerWidth,
      deviceScale: window.devicePixelRatio,
      documentWidth: document.documentElement.scrollWidth,
      uncontainedOverflowers,
    };
  });
  assert.equal(
    structure.mainCount,
    1,
    `${pathname} should expose one main landmark`,
  );
  assert.equal(structure.h1Count, 1, `${pathname} should expose one page h1`);
  assert.equal(
    structure.viewportWidth,
    width,
    `${pathname} should use a ${width}px CSS viewport`,
  );
  assert.equal(
    structure.deviceScale,
    expectedDeviceScale,
    `${pathname} should use ${expectedDeviceScale}x device scale`,
  );
  assert(
    structure.documentWidth <= width,
    `${pathname} overflows at ${width}px (${structure.documentWidth}px document): ${JSON.stringify(structure.uncontainedOverflowers)}`,
  );
}

async function assertShellIdentity() {
  const identity = await page.evaluate(() => ({
    sameDocument: window.__comsShellIdentity?.document === document,
    sameSidebar:
      window.__comsShellIdentity?.sidebar ===
      document.querySelector('[data-slot="sidebar"]'),
  }));
  assert.equal(
    identity.sameDocument,
    true,
    "internal navigation replaced the document",
  );
  assert.equal(
    identity.sameSidebar,
    true,
    "internal navigation remounted the sidebar",
  );
}

async function rememberShellIdentity() {
  await page.evaluate(() => {
    window.__comsShellIdentity = {
      document,
      sidebar: document.querySelector('[data-slot="sidebar"]'),
    };
  });
}

async function saveScreenshot(name, scale = "css", fullPage = true) {
  await page.screenshot({
    path: path.join(outputDirectory, name),
    fullPage,
    animations: "disabled",
    scale,
  });
}

let baseUrl;

(async () => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fixture = await createOperationalApiFixture({ gatewaySecret });
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
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
  server.stdout.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-8_000);
  });
  server.stderr.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-8_000);
  });
  await waitForServer(baseUrl, server);

  const fixtureState = await fetch(`${fixture.baseUrl}/__fixture/state`).then(
    (response) => response.json(),
  );
  const branchId = fixtureState.staff[0].branch_ids[0];
  const draftReport = fixtureState.dailyReports.find(
    (report) => report.status === "DRAFT",
  );
  const submittedReport = fixtureState.dailyReports.find(
    (report) => report.status === "SUBMITTED",
  );
  const openDiscrepancyDispatch = fixtureState.dispatches.find(
    (dispatch) => dispatch.discrepancy_status === "OPEN",
  );
  assert(
    branchId && draftReport && submittedReport && openDiscrepancyDispatch,
    "Fixture requires an assigned branch and records for report and discrepancy review",
  );
  const routes = [
    "/roles",
    "/roles/new",
    "/roles/2",
    "/roles/3",
    "/roles/999",
    "/staff",
    "/branches",
    "/suppliers",
    "/stock-items",
    "/products",
    "/recipes",
    `/recipes/${fixtureState.products[0].id}`,
    `/branch-products?branch_id=${branchId}`,
    `/inventory?scope=BRANCH&branch_id=${branchId}`,
    "/receipts",
    `/receipts/${fixtureState.receipts[0].id}`,
    "/dispatches",
    "/dispatches?create=1",
    `/dispatches/${openDiscrepancyDispatch.id}`,
    `/reports?branch_id=${branchId}&status=all`,
    `/reports?branch_id=${branchId}&report_id=${draftReport.id}`,
  ];

  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(
        `${message.text()} (${message.location().url || "browser"})`,
      );
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push({ status: response.status(), url: response.url() });
    }
  });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("button", { name: /Test Operations Admin/ }).waitFor();
  await page.getByText("Total Revenue", { exact: true }).waitFor();
  await page.getByText("Total Visitors", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Cover page", exact: true }).waitFor();
  await assertPageStructure("/dashboard", 1440);
  const logoBounds = await page
    .getByRole("link", { name: "Go to your workspace" })
    .boundingBox();
  const quickBounds = await page
    .getByRole("button", { name: "Quick Actions" })
    .boundingBox();
  const navigationBounds = await page
    .getByRole("link", { name: "Supplier Receiving", exact: true })
    .first()
    .boundingBox();
  assert(
    logoBounds &&
      quickBounds &&
      navigationBounds &&
      logoBounds.y + logoBounds.height <= quickBounds.y &&
      quickBounds.y + quickBounds.height <= navigationBounds.y,
    "Quick Actions must sit between the logo and navigation",
  );
  const quickActionsButton = page.getByRole("button", {
    name: "Quick Actions",
  });
  await quickActionsButton.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("menuitem", { name: "Record supplier delivery" })
    .waitFor();
  await page.getByRole("menuitem", { name: "New dispatch" }).waitFor();
  for (const unavailableAction of [
    "New stock request",
    "New sale",
    "New daily report",
  ]) {
    assert.equal(
      await page.getByRole("menuitem", { name: unavailableAction }).count(),
      0,
      `Super Admin Quick Actions must omit ${unavailableAction}`,
    );
  }
  await page.keyboard.press("Escape");
  await page
    .getByRole("menuitem", { name: "Record supplier delivery" })
    .waitFor({ state: "detached" });
  assert(
    await quickActionsButton.evaluate(
      (element) => element === document.activeElement,
    ),
  );
  for (const [label, route, dialogTitle] of [
    ["Record supplier delivery", "/receipts?create=1", "Record supplier delivery"],
    ["New dispatch", "/dispatches?create=1", "Create dispatch"],
  ]) {
    await page.getByRole("button", { name: "Quick Actions" }).click();
    await page.getByRole("menuitem", { name: label }).click();
    await page.waitForURL(`**${route}`);
    await page.getByRole("dialog", { name: dialogTitle }).waitFor();
    await page.keyboard.press("Escape");
    await page.waitForURL((url) => !url.searchParams.has("create"));
  }
  for (const retiredRoute of [
    "/replenishment",
    "/replenishment/33000000-0000-4000-8000-000000000001",
  ]) {
    await navigate(retiredRoute);
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
  }
  const posPage = await context.newPage();
  await posPage.goto(`${baseUrl}/pos`, { waitUntil: "domcontentloaded" });
  await posPage.getByRole("heading", { name: "Page not found" }).waitFor();
  assert.equal(await posPage.locator("#pos-cart-panel").count(), 0);
  await posPage.close();
  await page.getByRole("link", { name: "Dashboard", exact: true }).first().click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("heading", { name: "Dashboard", level: 1 }).waitFor();
  await saveScreenshot("dashboard-desktop.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await saveScreenshot("dashboard-mobile.png");
  await page.setViewportSize({ width: 1440, height: 960 });
  await rememberShellIdentity();
  for (const [label, href, readyView] of [
    [
      "Supplier Receiving",
      "/receipts",
      page.getByRole("table", { name: "Supplier deliveries" }),
    ],
    [
      "Roles",
      "/roles",
      page.getByRole("table", { name: "Roles and their access summary" }),
    ],
    ["Inventory", "/inventory", page.getByRole("heading", { name: "Stock balances" })],
  ]) {
    await page.getByRole("link", { name: label, exact: true }).first().click();
    await page.waitForURL(`**${href}**`);
    await readyView.waitFor();
    await assertShellIdentity();
  }
  await page.goBack();
  await page.getByRole("main").waitFor();
  await assertShellIdentity();
  await page.goForward();
  await page.getByRole("main").waitFor();
  await assertShellIdentity();

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of routes) {
      await navigate(route);
      await assertPageStructure(route, width);
      if (route === "/roles/new") {
        await assertRoleWorkspaceScroll(
          width,
          route,
          "new-role-permission-search",
        );
      }
      if (route === "/roles/3") {
        await assertRoleWorkspaceScroll(
          width,
          route,
          "role-3-permission-search",
        );
      }
      if (
        width === 1440 &&
        route === `/dispatches/${openDiscrepancyDispatch.id}`
      ) {
        await page
          .getByRole("button", { name: "Request recount", exact: true })
          .waitFor();
        assert.equal(
          await page.getByRole("button", { name: "Receive dispatch" }).count(),
          0,
          "Super Admin cannot enter a branch dispatch receipt",
        );
        assert.equal(
          await page.getByRole("button", { name: "Report discrepancy" }).count(),
          0,
          "Super Admin cannot report a branch receipt discrepancy",
        );
        await page.getByText("The delivery count is short", { exact: false }).waitFor();
      }
      if (width === 195 && route === "/roles/5") {
        await assertRoleWorkspaceScroll(
          width,
          route,
          "role-5-permission-search",
        );
        const sharedEffect = await page
          .locator("[data-role-shared-effect]")
          .evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return { height: rect.height, position: style.position };
          });
        assert(
          sharedEffect.height > 8 && sharedEffect.position !== "absolute",
          `Predefined-role guidance must remain visible at 195px: ${JSON.stringify(sharedEffect)}`,
        );
      }
      if (width === 768 && route === "/roles/new") {
        await saveScreenshot("role-create-page-768.png");
      }
      if (width === 768 && route === "/roles/3") {
        await saveScreenshot("role-edit-page-768.png");
      }
      if (width === 390 && route === "/roles") {
        const roleTableRegion = page.getByRole("region", {
          name: "Role table",
        });
        await roleTableRegion.focus();
        const scroll = await roleTableRegion.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
          return {
            scrollLeft: element.scrollLeft,
            focused: document.activeElement === element,
          };
        });
        assert(scroll.focused && scroll.scrollLeft > 0);
      }
      if (width === 390 && route === "/staff") {
        await page.getByRole("table", { name: "Staff directory" }).waitFor();
        await saveScreenshot("staff-directory-mobile.png");
      }
      if (width === 1440 && route === "/roles") {
        const roleDirectory = page.getByRole("table", {
          name: "Roles and their access summary",
        });
        const directoryText = await roleDirectory.innerText();
        assert(directoryText.includes("Commissary Manager"));
        assert(directoryText.includes("Predefined"));
        for (const code of ["SUPER_ADMIN", "COMMISSARY_MANAGER"]) {
          assert(
            !directoryText.includes(code),
            `Role code ${code} appears in the directory`,
          );
        }
        for (const row of await roleDirectory.locator("tbody tr").all()) {
          assert.equal(
            await row.getByRole("link").count(),
            0,
            "Role names in the directory should not be links",
          );
        }
        await saveScreenshot("roles-desktop.png");
      }
      if (width === 1440 && route === "/roles/new") {
        await saveScreenshot("role-create-page-desktop.png");
      }
      if (width === 1440 && route === "/roles/3") {
        await saveScreenshot("role-edit-page-desktop.png");
      }
      if (width === 1920 && route === "/roles/new") {
        await saveScreenshot("role-create-page-1920.png");
      }
      if (width === 1920 && route === "/roles/3") {
        await saveScreenshot("role-edit-page-1920.png");
      }
      if (
        width === 1440 &&
        route === `/reports?branch_id=${branchId}&report_id=${draftReport.id}`
      ) {
        await saveScreenshot("daily-report-desktop.png");
      }
    }
    console.log(`PASS ${routes.length} route states at ${width}px`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/suppliers");
  await page.getByRole("button", { name: "Add supplier" }).click();
  const createSupplierDialog = page.getByRole("dialog", {
    name: "Create supplier",
  });
  await createSupplierDialog
    .getByRole("heading", { name: "Supplier details" })
    .waitFor();
  await createSupplierDialog
    .getByRole("heading", { name: /Contact information/ })
    .waitFor();
  await saveScreenshot("supplier-create-modal-desktop.png", "css", false);
  await page.keyboard.press("Escape");
  await createSupplierDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 390, height: 667 });
  await navigate("/suppliers");
  await page.getByRole("button", { name: "Add supplier" }).click();
  await createSupplierDialog.waitFor();
  await saveScreenshot("supplier-create-modal-mobile.png", "css", false);
  const supplierModalLayout = await createSupplierDialog.evaluate((dialog) => {
    const body = dialog.querySelector("form > div:first-child");
    const footer = dialog.querySelector('[data-slot="dialog-footer"]');
    if (!body || !footer) return null;
    return {
      dialogLeft: dialog.getBoundingClientRect().left,
      dialogRight: dialog.getBoundingClientRect().right,
      footerBottom: footer.getBoundingClientRect().bottom,
      bodyScrollable: body.scrollHeight > body.clientHeight,
    };
  });
  assert(
    supplierModalLayout &&
      supplierModalLayout.dialogLeft >= 0 &&
      supplierModalLayout.dialogRight <= 390 &&
      supplierModalLayout.footerBottom <= 667,
    `Create supplier modal leaves the mobile viewport: ${JSON.stringify(supplierModalLayout)}`,
  );
  await page.keyboard.press("Escape");
  await createSupplierDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/stock-items");
  await page.getByRole("button", { name: "Add stock item" }).click();
  const createStockItemDialog = page.getByRole("dialog", {
    name: "Create stock item",
  });
  await createStockItemDialog
    .getByRole("heading", { name: "Classification and unit" })
    .waitFor();
  await saveScreenshot("stock-item-create-modal-desktop.png", "css", false);
  const stockNameInput = createStockItemDialog.getByRole("textbox", {
    name: "Stock item name",
  });
  await stockNameInput.focus();
  await page.keyboard.press("Tab");
  const stockCategoryTrigger = createStockItemDialog.getByRole("combobox", {
    name: "Category",
  });
  assert(
    await stockCategoryTrigger.evaluate(
      (element) => element === document.activeElement,
    ),
  );
  await page.keyboard.press("Tab");
  assert(
    await createStockItemDialog
      .getByRole("textbox", { name: "Unit" })
      .evaluate((element) => element === document.activeElement),
  );
  await page.keyboard.press("Escape");
  await createStockItemDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 390, height: 667 });
  await navigate("/stock-items");
  await page.getByRole("button", { name: "Add stock item" }).click();
  await createStockItemDialog.waitFor();
  await saveScreenshot("stock-item-create-modal-mobile.png", "css", false);
  await createStockItemDialog
    .getByRole("combobox", { name: "Category" })
    .click();
  const categoryPopup = page.locator('[data-slot="select-content"]');
  await page.getByRole("option", { name: "Dry goods" }).waitFor();
  await saveScreenshot("stock-item-category-dropdown-mobile.png", "css", false);
  const categoryPopupBounds = await categoryPopup.boundingBox();
  assert(
    categoryPopupBounds &&
      categoryPopupBounds.x >= 0 &&
      categoryPopupBounds.x + categoryPopupBounds.width <= 390 &&
      categoryPopupBounds.y >= 0 &&
      categoryPopupBounds.y + categoryPopupBounds.height <= 667,
    `Stock item category menu leaves the mobile viewport: ${JSON.stringify(categoryPopupBounds)}`,
  );
  await page.getByRole("option", { name: "Dry goods" }).click();
  assert.match(
    await createStockItemDialog
      .getByRole("combobox", { name: "Category" })
      .innerText(),
    /Dry goods/,
  );
  const stockItemModalLayout = await createStockItemDialog.evaluate(
    (dialog) => {
      const footer = dialog.querySelector('[data-slot="dialog-footer"]');
      if (!footer) return null;
      const bounds = dialog.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        footerBottom: footer.getBoundingClientRect().bottom,
      };
    },
  );
  assert(
    stockItemModalLayout &&
      stockItemModalLayout.left >= 0 &&
      stockItemModalLayout.right <= 390 &&
      stockItemModalLayout.footerBottom <= 667,
    `Create stock item modal leaves the mobile viewport: ${JSON.stringify(stockItemModalLayout)}`,
  );
  await page.keyboard.press("Escape");
  await createStockItemDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 390, height: 667 });
  await navigate("/branches");
  await page.getByRole("button", { name: "Add branch" }).click();
  const createBranchDialog = page.getByRole("dialog", {
    name: "Create branch",
  });
  const dateOpenedTrigger = createBranchDialog.getByRole("button", {
    name: /Date opened:/,
  });
  const branchInputRadius = await createBranchDialog
    .getByRole("textbox", { name: "Branch name" })
    .evaluate((element) => getComputedStyle(element).borderRadius);
  const dateTriggerRadius = await dateOpenedTrigger.evaluate(
    (element) => getComputedStyle(element).borderRadius,
  );
  assert.equal(
    dateTriggerRadius,
    branchInputRadius,
    "Date opened should match the other Create branch input corners",
  );
  await dateOpenedTrigger.focus();
  await page.keyboard.press("Enter");
  const branchCalendar = page.locator(
    '[data-slot="popover-content"] [data-slot="calendar"]',
  );
  await branchCalendar.waitFor();
  await saveScreenshot("branch-create-date-picker-mobile.png", "css", false);
  const calendarBounds = await branchCalendar.boundingBox();
  assert(
    calendarBounds &&
      calendarBounds.x >= 0 &&
      calendarBounds.x + calendarBounds.width <= 390 &&
      calendarBounds.y >= 0 &&
      calendarBounds.y + calendarBounds.height <= 667,
    `Branch calendar leaves the mobile viewport: ${JSON.stringify(calendarBounds)}`,
  );
  await page.keyboard.press("Escape");
  await branchCalendar.waitFor({ state: "detached" });
  await createBranchDialog.waitFor();
  await dateOpenedTrigger.click();
  await branchCalendar.waitFor();
  const todayDataDay = await page.evaluate(() =>
    new Date().toLocaleDateString(),
  );
  await page
    .locator(`[data-slot="popover-content"] button[data-day="${todayDataDay}"]`)
    .click();
  await branchCalendar.waitFor({ state: "detached" });
  assert(
    !(await dateOpenedTrigger.getAttribute("aria-label")).includes(
      "No date selected",
    ),
  );
  await dateOpenedTrigger.click();
  await page.getByRole("button", { name: "Clear date" }).click();
  assert(
    (await dateOpenedTrigger.getAttribute("aria-label")).includes(
      "No date selected",
    ),
  );
  await page.keyboard.press("Escape");
  await createBranchDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 1586, height: 992 });
  await navigate("/staff");
  await page.getByRole("table", { name: "Staff directory" }).waitFor();
  await saveScreenshot("staff-directory-desktop.png", "css", false);
  await page.getByRole("link", { name: "Inactive", exact: true }).click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/staff" &&
      url.searchParams.get("status") === "inactive",
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Inactive", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  const inactiveRows = page
    .getByRole("table", { name: "Staff directory" })
    .locator("tbody tr");
  assert((await inactiveRows.count()) > 0);
  for (const row of await inactiveRows.all()) {
    assert.match(await row.innerText(), /Inactive/);
  }
  const staffSearch = page.getByRole("searchbox", { name: "Search staff" });
  await staffSearch.fill("Fixture Staff 03");
  await staffSearch.press("Enter");
  await page.waitForURL(
    (url) =>
      url.pathname === "/staff" &&
      url.searchParams.get("status") === "inactive" &&
      url.searchParams.get("search") === "Fixture Staff 03",
  );
  const matchingRows = page
    .getByRole("table", { name: "Staff directory" })
    .locator("tbody tr");
  assert.equal(await matchingRows.count(), 1);
  await page
    .getByRole("button", { name: "Actions for Fixture Staff 03" })
    .click();
  await page.getByRole("menuitem", { name: "Manage staff" }).waitFor();
  await page.keyboard.press("Escape");
  await navigate("/staff");
  await page.getByRole("button", { name: "Add staff" }).click();
  const addStaffDialog = page.getByRole("dialog", { name: "Add staff" });
  await addStaffDialog.waitFor();
  await saveScreenshot("staff-add-modal-desktop.png", "css", false);
  const desktopModal = await addStaffDialog.boundingBox();
  assert(
    desktopModal && desktopModal.width >= 680 && desktopModal.width <= 720,
  );
  assert(Math.abs(desktopModal.x + desktopModal.width / 2 - 793) < 2);
  await addStaffDialog.getByRole("button", { name: "Create staff" }).click();
  for (const message of [
    "Enter a full name with 2 to 160 characters.",
    "Enter a valid email address.",
    "Enter a Philippine mobile number with 10 digits after +63.",
    "Use at least 12 characters.",
  ]) {
    await addStaffDialog
      .getByRole("alert")
      .filter({ hasText: message })
      .waitFor();
  }
  await addStaffDialog
    .getByRole("textbox", { name: "Email" })
    .fill("invalid-email");
  assert.equal(
    await addStaffDialog
      .getByRole("combobox", { name: "Country code" })
      .count(),
    0,
  );
  const contactInput = addStaffDialog.getByRole("textbox", {
    name: "Contact number",
  });
  await contactInput.fill("09a171234567");
  assert.equal(await contactInput.inputValue(), "9171234567");
  await contactInput.fill("123");
  await addStaffDialog.getByLabel("Initial password").fill("short");
  await addStaffDialog.getByRole("button", { name: "Create staff" }).click();
  assert.equal(await addStaffDialog.getByRole("alert").count(), 4);
  await addStaffDialog.getByRole("button", { name: "Close Add staff" }).click();
  await page
    .getByRole("alertdialog", { name: "Discard unsaved staff changes?" })
    .waitFor();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await addStaffDialog.waitFor({ state: "detached" });

  await page.setViewportSize({ width: 390, height: 667 });
  await navigate("/staff");
  await page.getByRole("button", { name: "Add staff" }).click();
  await saveScreenshot("staff-add-modal-mobile-top.png", "css", false);
  const mobileModal = await addStaffDialog.boundingBox();
  assert(
    mobileModal &&
      mobileModal.x >= 0 &&
      mobileModal.x + mobileModal.width <= 390,
  );
  const modalScroll = await addStaffDialog.evaluate((dialog) => {
    const body = dialog.querySelector("form > div:first-child");
    const footer = dialog.querySelector('[data-slot="dialog-footer"]');
    if (!body || !footer) return null;
    body.scrollTop = body.scrollHeight;
    return {
      scrollable: body.scrollHeight > body.clientHeight && body.scrollTop > 0,
      footerVisible:
        footer.getBoundingClientRect().bottom <= window.innerHeight,
    };
  });
  assert(modalScroll?.scrollable && modalScroll.footerVisible);
  await saveScreenshot("staff-add-modal-mobile.png", "css", false);
  await page.keyboard.press("Escape");
  await addStaffDialog.waitFor({ state: "detached" });

  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await navigate(route);
    await assertPageStructure(`${route} dark`, 390);
    if (route === "/roles") await saveScreenshot("roles-dark-mobile.png");
    if (route === "/roles/new")
      await saveScreenshot("role-create-page-dark-mobile.png");
    if (route === "/roles/3")
      await saveScreenshot("role-edit-page-dark-mobile.png");
  }
  console.log(`PASS ${routes.length} operational route states in dark mode`);
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );

  const zoomEmulation = await context.newCDPSession(page);
  await zoomEmulation.send("Emulation.setDeviceMetricsOverride", {
    width: 195,
    height: 422,
    deviceScaleFactor: 2,
    mobile: false,
  });
  for (const route of routes) {
    await navigate(route);
    await assertPageStructure(`${route} at 2x scale`, 195, 2);
    if (route === "/roles")
      await saveScreenshot("roles-2x-scale-mobile.png", "device");
  }
  console.log(
    `PASS ${routes.length} operational route states at 2x scale and 195 CSS pixels`,
  );
  await zoomEmulation.send("Emulation.clearDeviceMetricsOverride");
  await zoomEmulation.detach();

  await page.setViewportSize({ width: 390, height: 844 });
  await navigate("/roles/new");
  await assertRoleWorkspaceScroll(
    390,
    "/roles/new",
    "new-role-permission-search",
  );
  await saveScreenshot("role-create-page-mobile.png");
  await page.getByRole("textbox", { name: "Role name" }).fill("Temporary role");
  await page.getByRole("textbox", { name: "Role code" }).fill("TEMPORARY_ROLE");
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page
    .getByRole("alertdialog", { name: "Discard unsaved role changes?" })
    .waitFor();
  await page.getByRole("button", { name: "Keep editing" }).click();
  assert.equal(
    await page.getByRole("textbox", { name: "Role code" }).inputValue(),
    "TEMPORARY_ROLE",
  );
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page.waitForURL("**/roles");

  await page.setViewportSize({ width: 390, height: 667 });
  await navigate("/roles/new");
  await assertRoleWorkspaceScroll(
    390,
    "/roles/new",
    "new-role-permission-search",
  );
  await saveScreenshot("role-create-page-mobile-short.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page.waitForURL("**/roles");
  await rememberShellIdentity();
  await openRoleAction("Branch Manager", "Manage role");
  await page.waitForURL("**/roles/5");
  await assertShellIdentity();
  await page
    .getByText("Permission changes apply to everyone assigned to this role.")
    .waitFor();
  await page.getByText("Predefined", { exact: true }).waitFor();
  const managerAdjustPermission = page.getByRole("checkbox", {
    name: /Branch Manager inventory\.adjust/,
  });
  assert.equal(
    await managerAdjustPermission.getAttribute("aria-checked"),
    "false",
  );
  await managerAdjustPermission.click();
  await page.getByRole("button", { name: "Save permissions" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Permissions updated." })
    .waitFor();
  assert.equal(
    await managerAdjustPermission.getAttribute("aria-checked"),
    "true",
  );
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page.waitForURL("**/roles");

  await openRoleAction("Super Admin", "View role");
  await page.waitForURL("**/roles/2");
  await assertShellIdentity();
  await page.getByRole("heading", { name: "View role" }).waitFor();
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page.waitForURL("**/roles");

  await openRoleAction("Stock Manager", "Manage role");
  await page.waitForURL("**/roles/3");
  await assertShellIdentity();
  const roleNameInput = page.getByRole("textbox", { name: "Role name" });
  await roleNameInput.fill("Senior Stock Manager");
  const adjustPermission = page.getByRole("checkbox", {
    name: /Stock Manager inventory\.adjust/,
  });
  await adjustPermission.click();
  await page.getByRole("button", { name: "Save role name" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Role name updated." })
    .waitFor();
  await assertShellIdentity();
  const savedPermissionDraft = page.getByRole("checkbox", {
    name: /inventory\.adjust/,
  });
  assert.equal(await savedPermissionDraft.getAttribute("aria-checked"), "true");
  await page.getByRole("button", { name: "Save permissions" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Permissions updated." })
    .waitFor();
  await assertShellIdentity();

  await page.setViewportSize({ width: 390, height: 844 });
  await navigate("/roles/3");
  await assertRoleWorkspaceScroll(390, "/roles/3", "role-3-permission-search");
  await saveScreenshot("role-edit-page-mobile.png");
  await page.setViewportSize({ width: 390, height: 667 });
  await assertRoleWorkspaceScroll(390, "/roles/3", "role-3-permission-search");
  await saveScreenshot("role-edit-page-mobile-short.png");
  await navigate("/roles/5");
  await assertRoleWorkspaceScroll(390, "/roles/5", "role-5-permission-search");
  const predefinedEffect = await page
    .locator("[data-role-shared-effect]")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { height: rect.height, position: style.position };
    });
  assert(
    predefinedEffect.height > 8 && predefinedEffect.position !== "absolute",
    `Predefined-role shared-effect guidance must remain visible at 390x667: ${JSON.stringify(predefinedEffect)}`,
  );
  await saveScreenshot("role-edit-predefined-mobile-short.png");
  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/roles/3");
  const unsavedRoleName = page.getByRole("textbox", { name: "Role name" });
  await unsavedRoleName.fill("Unsaved Stock Manager");
  await page.getByRole("link", { name: "Back to roles" }).click();
  await page
    .getByRole("alertdialog", { name: "Discard unsaved role changes?" })
    .waitFor();
  await page.getByRole("button", { name: "Keep editing" }).click();
  assert.equal(await unsavedRoleName.inputValue(), "Unsaved Stock Manager");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page.waitForURL("**/roles");
  await navigate("/roles/2");
  await page
    .getByText("This protected role has global access across COMS.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Save permissions" }).count(),
    0,
  );
  await navigate("/roles/999");
  await page.getByRole("heading", { name: "Page not found" }).waitFor();
  await page.goto(`${baseUrl}/roles/invalid`, {
    waitUntil: "domcontentloaded",
  });
  // Authenticated routes stream their loading shell before role validation, so
  // Next.js can retain the initial 200 response when rendering the 404 state.
  await page.getByRole("heading", { name: "Page not found" }).waitFor();

  await navigate(`/reports?branch_id=${branchId}&status=all`);
  assert.equal(
    await page.getByRole("button", { name: "Create report" }).count(),
    0,
    "Super Admin must not prepare a branch daily report",
  );

  await navigate(`/reports?branch_id=${branchId}&report_id=${draftReport.id}`);
  await saveScreenshot("daily-report-counts-mobile.png");
  assert.equal(
    await page.getByRole("textbox", { name: /Physical closing for/ }).count(),
    0,
    "Super Admin daily report review must keep physical counts read-only",
  );
  assert.equal(await page.getByRole("button", { name: "Save counts" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Submit for review" }).count(), 0);

  await navigate(
    `/reports?branch_id=${branchId}&report_id=${submittedReport.id}`,
  );
  await page.getByRole("button", { name: "Return for correction" }).waitFor();
  await page.getByRole("button", { name: "Approve report" }).waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: /Physical closing for/ }).count(),
    0,
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await navigate("/suppliers");
  const supplierRow = page
    .getByRole("table", { name: "Suppliers" })
    .locator("tbody tr")
    .first();
  await supplierRow
    .getByRole("button", { name: "More actions for North Farm Supply" })
    .click();
  const supplierActions = page.getByRole("menu");
  await supplierActions.waitFor({ state: "visible" });
  await page.getByRole("menuitem", { name: "View details" }).waitFor();
  await page.getByRole("menuitem", { name: "Edit" }).waitFor();
  await page.getByRole("menuitem", { name: "Deactivate" }).waitFor();
  await saveScreenshot("supplier-actions-menu-desktop.png");
  await page.keyboard.press("Escape");
  await supplierActions.waitFor({ state: "detached" });
  await page.setViewportSize({ width: 390, height: 844 });

  await navigate(
    `/suppliers?search=${encodeURIComponent("no fixture supplier matches this")}`,
  );
  await page.getByText(/No suppliers found/i).waitFor();
  await assertPageStructure("/suppliers filtered empty state", 390);

  assert.deepEqual(
    browserErrors,
    [],
    `Browser reported console or uncaught page errors. HTTP failures: ${JSON.stringify(failedResponses)}`,
  );
  console.log(
    "PASS authenticated client navigation, Back/Forward, and mutation refresh preserve the shell",
  );
  console.log(
    "PASS Super Admin report review hides branch preparation and keeps review actions available",
  );
  console.log("PASS supplier row actions open as a dismissible action menu");
  console.log(`Screenshots: ${path.relative(root, outputDirectory)}`);
})()
  .catch(async (error) => {
    console.error(error.stack ?? error.message);
    if (page) {
      try {
        const failureText = await page
          .locator("body")
          .innerText({ timeout: 2_000 });
        console.error(failureText.slice(0, 1_200));
        await page.screenshot({
          path: path.join(outputDirectory, "failure.png"),
        });
      } catch {
        // The browser may have exited before a useful page state was captured.
      }
    }
    if (serverOutput) console.error(serverOutput);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      if (process.platform === "win32" && server.pid) {
        await new Promise((resolve) => {
          const killer = spawn(
            "taskkill",
            ["/pid", String(server.pid), "/t", "/f"],
            {
              stdio: "ignore",
              windowsHide: true,
            },
          );
          killer.once("exit", resolve);
          killer.once("error", resolve);
        });
      } else {
        server.kill("SIGTERM");
      }
    }
    if (fixture) await fixture.close();
  });
