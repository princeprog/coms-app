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
  const pending = page.getByRole("region", { name: "Pending receiving" });
  await pending.getByRole("link", { name: "Count delivery" }).first().waitFor();
  await pending.getByRole("combobox", { name: "Receiving status" }).click();
  await page.getByRole("option", { name: "Overdue", exact: true }).click();
  await pending
    .locator("[data-slot=badge]")
    .filter({ hasText: "Overdue" })
    .first()
    .waitFor();
  const overdueHref = await pending
    .getByRole("link", { name: "Count delivery" })
    .first()
    .getAttribute("href");
  await pending
    .getByRole("combobox", { name: "Pending deliveries per page" })
    .click();
  await page.getByRole("option", { name: "30 per page", exact: true }).click();
  await page.goto(`${baseUrl}${overdueHref}`);
  await page
    .getByRole("button", { name: "Count delivery", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Count delivery" });
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
  await pending.getByRole("combobox", { name: "Receiving status" }).click();
  await page.getByRole("option", { name: "Under review", exact: true }).click();
  await pending.getByRole("link", { name: "View review" }).first().click();
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
  await pending.getByRole("link").first().waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "test-results/receiving-followup/pending-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: pending list, filters/page size, overdue count validation, focus, preserved draft/review, approved-report hold, return reason, responsive/dark layouts. Synthetic UI data only.",
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
