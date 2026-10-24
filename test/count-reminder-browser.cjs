// Production frontend against a loopback fixture; recipient/transaction rules are tested by API e2e tests.
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { randomBytes, randomUUID } = require("node:crypto");
const { chromium } = require("playwright");
const {
  createOperationalApiFixture,
} = require("./operational-api-fixture.cjs");
const { handleNotifications } = require("./fixtures/notifications-fixture.cjs");
const { user } = require("./fixtures/operational-api.json");
const root = path.resolve(__dirname, "..");
const secret = randomBytes(32).toString("hex");
let fixture, proxy, server, browser, page;
let output = "";
const notifications = [],
  requests = [];
const reminders = new Map();
let failNext = true;
function json(response, status, data) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function listen(server) {
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server.address().port)),
  );
}
function decorate(dispatch) {
  const saved = reminders.get(dispatch.id);
  return {
    ...dispatch,
    receive_by:
      dispatch.receive_by ?? new Date(Date.now() + 86400000).toISOString(),
    receiving_status: dispatch.counted_at
      ? "COUNTED"
      : dispatch.status === "DRAFT"
        ? "NONE"
        : "AWAITING_COUNT",
    count_reminder: saved?.metadata ?? {
      last_sent_at: null,
      next_allowed_at: null,
    },
    ...(dispatch.events && saved
      ? { events: [...dispatch.events, saved.event] }
      : {}),
  };
}
(async () => {
  fs.mkdirSync(path.join(root, "test-results/count-reminders"), {
    recursive: true,
  });
  fixture = await createOperationalApiFixture({ gatewaySecret: secret });
  const state = await (
    await fetch(fixture.baseUrl + "/__fixture/state")
  ).json();
  const target = state.dispatches.find((d) => d.status === "IN_TRANSIT");
  assert(target);
  proxy = http.createServer(async (request, response) => {
    try {
      if (request.headers["x-coms-auth-gateway"] !== secret)
        return json(response, 401, {});
      const url = new URL(request.url, "http://127.0.0.1");
      if (
        handleNotifications({
          request,
          response,
          url,
          items: notifications,
          send: json,
        })
      )
        return;
      const match = url.pathname.match(
        /^\/dispatches\/([^/]+)\/count-reminders$/,
      );
      if (match && request.method === "POST") {
        requests.push(request.headers["idempotency-key"]);
        if (failNext) {
          failNext = false;
          return json(response, 503, {
            message: "Temporary reminder outage. Please try again.",
          });
        }
        const id = match[1];
        const prior = reminders.get(id);
        if (prior && prior.key !== request.headers["idempotency-key"])
          return json(response, 429, {
            message: "Please wait before sending another reminder.",
            next_allowed_at: prior.metadata.next_allowed_at,
          });
        const dispatch = await (
          await fetch(fixture.baseUrl + "/dispatches/" + id, {
            headers: {
              "x-coms-auth-gateway": secret,
              cookie: "coms_access=fixture-access-token",
            },
          })
        ).json();
        if (!prior) {
          const at = new Date().toISOString();
          reminders.set(id, {
            key: request.headers["idempotency-key"],
            metadata: {
              last_sent_at: at,
              next_allowed_at: new Date(Date.now() + 1800000).toISOString(),
            },
            event: {
              id: randomUUID(),
              dispatch_id: id,
              event_type: "COUNT_REMINDER_SENT",
              actor_user_id: user.id,
              actor_name: user.full_name,
              dispatch_receipt_id: null,
              shortage_closure_id: null,
              created_at: at,
            },
          });
          notifications.push({
            id: randomUUID(),
            kind: "DISPATCH_COUNT_REMINDER",
            branch_id: dispatch.branch_id,
            branch_name: dispatch.branch_name,
            dispatch_id: id,
            report_id: null,
            business_date: null,
            created_at: at,
            read_at: null,
          });
        }
        return json(response, 201, decorate(dispatch));
      }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const upstream = await fetch(fixture.baseUrl + request.url, {
        method: request.method,
        headers: {
          "x-coms-auth-gateway": secret,
          cookie: "coms_access=fixture-access-token",
          "content-type": "application/json",
        },
        ...(body.length ? { body } : {}),
      });
      const data = await upstream.json();
      if (url.pathname === "/dispatches" && data.items)
        data.items = data.items.map(decorate);
      return json(
        response,
        upstream.status,
        /^\/dispatches\/[^/]+$/.test(url.pathname) && data.id
          ? decorate(data)
          : data,
      );
    } catch (error) {
      json(response, 500, { message: "Fixture error: " + error.message });
    }
  });
  const apiPort = await listen(proxy);
  const probe = http.createServer();
  const port = await listen(probe);
  await new Promise((r) => probe.close(r));
  const origin = `http://127.0.0.1:${port}`;
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
        COMS_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
        COMS_AUTH_GATEWAY_SECRET: secret,
      },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk).slice(-8000);
    });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      ready = (await fetch(origin)).status < 500;
    } catch {}
    if (ready) break;
    await sleep(200);
  }
  assert(ready, output);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
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
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/dispatches/" + target.id);
  const reminder = page.getByRole("button", {
    name: "Remind branch to submit count",
    exact: true,
  });
  await reminder.focus();
  await page.keyboard.press("Enter");
  await page
    .getByText("Temporary reminder outage. Please try again.", { exact: true })
    .waitFor();
  await reminder.click();
  await page.getByText(/Last reminded/).waitFor();
  assert.equal(requests.length, 2);
  assert.equal(requests[0], requests[1]);
  assert.equal(notifications.length, 1);
  assert(await reminder.isDisabled());
  await page.getByText(/Available again/).waitFor();
  const activity = page.locator("summary").filter({ hasText: "View activity" });
  await activity.click();
  await page
    .getByRole("heading", { name: "Count reminder sent", exact: true })
    .waitFor();
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme });
    await page.waitForFunction(
      (t) => document.documentElement.classList.contains(t),
      theme,
    );
    await page.screenshot({
      path: `test-results/count-reminders/${theme}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/count-reminders/mobile.png",
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.goto(origin + "/notifications");
  await page.getByRole("link", { name: /Delivery count pending/ }).click();
  await page.waitForURL("**/dispatches/" + target.id + "?**");
  await reminder.waitFor();
  assert(await reminder.isDisabled());
  assert(!JSON.stringify(notifications).includes("quantity"));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(
    origin + "/dispatches?search=" + encodeURIComponent(target.branch_name),
  );
  const menus = page.getByRole("button", {
    name: new RegExp(`Actions for .* dispatch`),
  });
  await menus.first().waitFor();
  let found = false;
  for (let i = 0; i < (await menus.count()); i++) {
    await menus.nth(i).click();
    const link = page.getByRole("menuitem", { name: "View dispatch" });
    if ((await link.getAttribute("href")) === `/dispatches/${target.id}`) {
      const item = page.getByRole("menuitem", {
        name: /Remind branch to submit count/,
      });
      await item.waitFor();
      assert((await item.getAttribute("aria-disabled")) === "true");
      found = true;
      break;
    }
    await page.keyboard.press("Escape");
  }
  assert(found, "Target row menu not found");
  assert.deepEqual(errors, []);
  console.log(
    "PASS detail and row reminder actions, uncertain retry key, cooldown, activity, notification navigation, keyboard, light/dark and mobile",
  );
})()
  .catch(async (error) => {
    console.error(error);
    if (page)
      await page
        .screenshot({
          path: "test-results/count-reminders/failure.png",
          fullPage: true,
        })
        .catch(() => {});
    console.error(output);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((r) => server.once("exit", r));
    }
    if (proxy) {
      proxy.closeAllConnections();
      await new Promise((r) => proxy.close(r));
    }
    if (fixture) await fixture.close();
  });
