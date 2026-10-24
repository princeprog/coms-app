// Production UI checks against synthetic loopback data; no live records are changed.
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
const {
  checkDispatchCreateModal,
} = require("./fixtures/check-dispatch-create-modal.cjs");
const seed = require("./fixtures/operational-api.json");
let fixture,
  server,
  browser,
  page,
  output = "";
const freePort = () =>
  new Promise((resolve) => {
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1", () => {
      const port = listener.address().port;
      listener.close(() => resolve(port));
    });
  });
(async () => {
  const gatewaySecret = crypto.randomBytes(32).toString("hex");
  fixture = await createOperationalApiFixture({
    gatewaySecret,
    receivingFollowup: true,
    authUser: {
      ...seed.user,
      branch_ids: Array.from(
        { length: 26 },
        (_, i) => `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      ),
      id: "00000000-0000-4000-8000-0000000000bb",
      role: {
        ...seed.user.role,
        code: "RECEIVING_TESTER",
        name: "Receiving tester",
        isSystem: false,
      },
    },
  });
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      path.join(process.cwd(), "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(port),
      "-H",
      "127.0.0.1",
    ],
    {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        COMS_API_BASE_URL: fixture.baseUrl,
        COMS_AUTH_GATEWAY_SECRET: gatewaySecret,
      },
    },
  );
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk).slice(-8000);
    });
  for (let attempt = 0; attempt < 160; attempt++) {
    try {
      if ((await fetch(baseUrl)).status < 500) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push({ message: error.message, url: page.url() });
    console.error("Browser error at", page.url(), error.message);
  });
  await page.goto(baseUrl);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  await page.waitForURL("**/pos");
  await page.goto(`${baseUrl}/dispatches`);
  const views = page.getByRole("navigation", { name: "Dispatch views" });
  const table = page.getByRole("table", { name: "Dispatches", exact: true });
  await table.waitFor();
  await checkDispatchCreateModal(page);
  assert.equal(await page.getByRole("table").count(), 1);
  assert.equal(
    await page
      .getByText("Track delivery progress and reported discrepancies.")
      .count(),
    0,
  );
  await views.getByRole("link", { name: "Overdue", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/dispatches?receiving_status=OVERDUE");
  await table.getByText("Overdue", { exact: true }).first().waitFor();
  assert.equal(
    await table.getByText("Awaiting count", { exact: true }).count(),
    0,
  );
  await page.getByRole("combobox", { name: "Rows per page" }).click();
  await page.getByRole("option", { name: "30", exact: true }).click();
  await page.waitForURL("**page_size=30");
  await table.getByRole("button").first().click();
  const overdueHref = await page
    .getByRole("menuitem", { name: "View dispatch" })
    .getAttribute("href");
  await page.keyboard.press("Escape");
  await page.goto(`${baseUrl}${overdueHref}`);
  await page
    .getByRole("button", { name: "Count delivery", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Count delivery" });
  assert.equal(await dialog.locator('input[type="date"]').count(), 0);
  await dialog
    .getByRole("button", { name: "Review count", exact: true })
    .click();
  await dialog.getByText("Explain why this count is late.").waitFor();
  assert.equal(
    await dialog
      .locator("#late-count-reason")
      .evaluate((el) => document.activeElement === el),
    true,
  );
  await dialog
    .getByLabel("Reason for late count")
    .fill("Forgot to submit before the deadline.");
  for (const input of await dialog
    .locator('input[id^="dispatch-count-"]')
    .all())
    await input.fill("4");
  await dialog
    .getByRole("button", { name: "Review count", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Review delivery count" })
    .getByText("Forgot to submit before the deadline.")
    .waitFor();
  await page
    .getByRole("dialog", { name: "Review delivery count" })
    .getByText("The receiving date and time are recorded when you submit.")
    .waitFor();
  await page.getByRole("button", { name: "Back to edit", exact: true }).click();
  assert.equal(
    await page.getByLabel("Reason for late count").inputValue(),
    "Forgot to submit before the deadline.",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Discard count", exact: true })
    .click();
  await page.goto(`${baseUrl}/dispatches`);
  await views.getByRole("link", { name: "Count review", exact: true }).click();
  await page.waitForURL("**/dispatches?receiving_status=REVIEW");
  await table
    .getByText("Late count under review", { exact: true })
    .first()
    .waitFor();
  await table.getByRole("button").first().click();
  await page.getByRole("menuitem", { name: "View dispatch" }).click();
  await page
    .getByText(
      "Approved report requires correction. This count remains on hold.",
    )
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Post saved count", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .getByRole("button", { name: "Return for correction", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return for correction", exact: true })
    .click();
  await page.getByText("Enter a reason.", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByLabel("Reason for correction")
      .evaluate((el) => document.activeElement === el),
    true,
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  fs.mkdirSync("test-results/receiving-followup", { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `overflow at ${width}`,
    );
    await page.screenshot({
      path: `test-results/receiving-followup/review-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: "test-results/receiving-followup/review-dark.png",
    fullPage: true,
  });
  await page.goto(`${baseUrl}/dispatches`);
  await table.waitFor();
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `directory overflow at ${width}`,
    );
    await page.screenshot({
      path: `test-results/receiving-followup/directory-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({
    path: "test-results/receiving-followup/directory-dark.png",
    fullPage: true,
  });
  await views
    .getByRole("link", { name: "Pending receiving", exact: true })
    .click();
  await page.waitForURL("**/dispatches?receiving_status=pending");
  await table.waitFor();
  assert.equal(await table.getByText("Received", { exact: true }).count(), 0);
  const search = page.getByRole("searchbox", { name: "Search branch" });
  await search.fill("No matching dispatch branch");
  await page.getByText("No dispatches match these filters.").waitFor();
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await table.waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("receiving_status"),
    "pending",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: single directory, receiving views, filters/page size, overdue count validation, focus, preserved draft/review, approved-report hold, return reason, responsive/dark layouts. Synthetic UI data only.",
  );
})()
  .catch(async (error) => {
    console.error(error);
    console.error(output);
    console.error(await page?.locator("body").innerText());
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server?.kill();
    await fixture?.close();
  });
