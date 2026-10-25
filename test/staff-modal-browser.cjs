// Runs only against the loopback synthetic API, never the development database.
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
const root = path.resolve(__dirname, "..");
const output = path.join(root, "test-results/staff-modal");
const seed = require("./fixtures/operational-api.json");
let fixture, server, browser, page;
let logs = "";
const errors = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function port() {
  return new Promise((resolve) => {
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1", () => {
      const value = listener.address().port;
      listener.close(() => resolve(value));
    });
  });
}
async function theme(name) {
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
}
async function clearToasts() {
  for (let i = 0; i < 12; i++) {
    const close = page.locator(
      '[data-sileo-toast]:not([data-exiting="true"]) [data-sileo-close]',
    );
    if (!(await close.count())) break;
    await close.first().click();
    await pause(650);
  }
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const gatewaySecret = randomBytes(32).toString("hex");
  fixture = await createOperationalApiFixture({ gatewaySecret });
  const serverPort = await port();
  const base = `http://127.0.0.1:${serverPort}`;
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(serverPort),
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: root,
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
    stream.on("data", (data) => (logs = (logs + data).slice(-5000)));
  let ready = false;
  for (let i = 0; i < 120 && !ready; i++) {
    ready = await fetch(base).then(
      (r) => r.status < 500,
      () => false,
    );
    if (!ready) await pause(250);
  }
  assert(ready, logs);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);

  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(seed.login.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(seed.login.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/dashboard/);
  await page.goto(base + "/staff");
  const state = await fetch(fixture.baseUrl + "/__fixture/state").then((r) =>
    r.json(),
  );

  const member = state.staff.find((s) => s.full_name === "Fixture Staff 05");
  assert(member?.is_active);
  const actions = [
    "Edit profile",
    "Assign role",
    "Manage branch assignments",
    "Reset password",
    "Deactivate staff",
  ];
  const open = async (action = "Edit profile") => {
    await page
      .getByRole("button", {
        name: "Actions for " + member.full_name,
        exact: true,
      })
      .click();
    await page.getByRole("menuitem").first().waitFor();
    assert.deepEqual(
      await page.getByRole("menuitem").allTextContents(),
      actions,
    );
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    const modal = page.getByRole(
      action === "Reset password" || action === "Deactivate staff"
        ? "alertdialog"
        : "dialog",
    );
    await modal.waitFor();
    return modal;
  };
  for (const appearance of ["Light", "Dark"]) {
    await theme(appearance);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const action of actions) {
        const modal = await open(action);
        await modal.evaluate(async (el) => {
          await Promise.all(
            el
              .getAnimations({ subtree: true })
              .map((animation) => animation.finished.catch(() => {})),
          );
        });
        const box = await modal.boundingBox();
        assert(Math.abs(box.x + box.width / 2 - width / 2) < 2);
        assert(
          box.x >= 15 && box.x + box.width <= width - 15,
          JSON.stringify(box),
        );
        assert(box.y >= 0 && box.y + box.height <= 900);
        assert(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth));
        assert.equal(
          await modal.getByRole("textbox", { name: /Full name/ }).count(),
          action === "Edit profile" ? 1 : 0,
        );
        await page.screenshot({
          path: path.join(
            output,
            appearance +
              "-" +
              width +
              "-" +
              action.toLowerCase().replaceAll(" ", "-") +
              ".png",
          ),
        });
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press("Tab");
          await page.waitForFunction(
            (el) => el.contains(document.activeElement),
            await modal.elementHandle(),
          );
        }
        await modal
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
        await modal.waitFor({ state: "detached" });
        await page.waitForFunction(
          (name) =>
            document.activeElement?.getAttribute("aria-label") ===
            "Actions for " + name,
          member.full_name,
        );
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  let dialog = await open();
  const input = dialog.getByRole("textbox", { name: /Full name/ });
  await input.fill("Maria Updated");
  await page.keyboard.press("Escape");
  await page
    .getByRole("alertdialog", { name: "Discard unsaved staff changes?" })
    .waitFor();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(await input.inputValue(), "Maria Updated");
  const fail = (method, suffix) =>
    fetch(fixture.baseUrl + "/__fixture/fail-next", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        method,
        path: "/staff/" + member.id + suffix,
        status: 409,
        message: "Please retry this change.",
      }),
    });
  await fail("PATCH", "");
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  assert.equal(await input.inputValue(), "Maria Updated");
  assert.equal(await page.locator("[data-sileo-toast]").count(), 0);
  await dialog
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
  await page.getByText("Staff profile updated.", { exact: true }).waitFor();
  member.full_name = "Maria Updated";
  await page
    .getByRole("button", { name: "Actions for Maria Updated" })
    .waitFor();
  await clearToasts();
  dialog = await open("Assign role");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "Cashier", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Assign role", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
  await page.getByText("Staff role updated.", { exact: true }).waitFor();
  await clearToasts();
  dialog = await open("Manage branch assignments");
  const firstBranch = dialog.getByRole("checkbox").first();
  const checked = await firstBranch.isChecked();
  await firstBranch.click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("alertdialog", { name: "Discard unsaved staff changes?" })
    .waitFor();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(await firstBranch.isChecked(), !checked);
  await dialog
    .getByRole("button", { name: "Save branch assignments", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
  await page.getByText("Branch access updated.", { exact: true }).waitFor();
  await clearToasts();
  dialog = await open("Reset password");
  await fail("POST", "/password-reset");
  await dialog
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  await dialog
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await dialog.getByText("Synthetic-Reset-42!", { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  dialog = await open("Reset password");
  assert.equal(
    await page.getByText("Synthetic-Reset-42!", { exact: true }).count(),
    0,
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  dialog = await open("Deactivate staff");
  await fail("POST", "/deactivate");
  await dialog
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  await dialog
    .getByRole("button", { name: "Confirm deactivation", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
  await page.getByText("Staff account deactivated.", { exact: true }).waitFor();
  await clearToasts();
  await page.getByRole("button", { name: "Actions for Maria Updated" }).click();
  await page.getByRole("menuitem").first().waitFor();
  assert.deepEqual(
    await page.getByRole("menuitem").allTextContents(),
    actions.slice(0, 3),
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Add staff", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Add staff", exact: true });
  await create
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill("Maria Santos");
  await create
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("maria.santos@example.test");
  await create
    .getByRole("textbox", { name: "Contact number", exact: true })
    .fill("9171234567");
  await create
    .getByLabel("Initial password")
    .fill("Synthetic staff fixture 42!");
  await create
    .getByRole("button", { name: "Create staff", exact: true })
    .click();
  await create.waitFor({ state: "detached" });
  await page.getByText("Staff account created.", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "create-success.png") });
  assert.deepEqual(errors, []);
  console.log(
    "PASS five separate staff modals at 320/390/768/1440 in both themes, keyboard focus, dirty/failure recovery, saves, one-time password and deactivation.",
  );
})()
  .catch(async (error) => {
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png") })
        .catch(() => {});
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await pause(300);
    }
    if (fixture) await fixture.close();
  });
