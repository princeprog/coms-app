// Production Next.js + loopback fixture only; no real accounts or database.
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { chromium } = require("playwright");
const {
  createOperationalApiFixture,
} = require("./operational-api-fixture.cjs");
const { user } = require("./fixtures/operational-api.json");
const root = path.resolve(__dirname, "..");
const secret = randomBytes(32).toString("hex");
const state = {
  access: "fixture-access-token",
  refresh: "fixture-refresh-token",
  expired: false,
  rotations: 0,
  failRefresh: false,
  revoked: false,
};
let fixture, proxy, server, browser;
let output = "";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(work, message) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await work()) return;
    await sleep(100);
  }
  throw Error(message + "\n" + output.slice(-1500));
}
function listen(server) {
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve(server.address().port)),
  );
}
function json(response, status, data, cookies) {
  response.writeHead(status, {
    "content-type": "application/json",
    ...(cookies ? { "set-cookie": cookies } : {}),
  });
  response.end(JSON.stringify(data));
}
(async () => {
  fixture = await createOperationalApiFixture({ gatewaySecret: secret });
  proxy = http.createServer(async (request, response) => {
    try {
      if (request.headers["x-coms-auth-gateway"] !== secret)
        return json(response, 401, {});
      const cookies = Object.fromEntries(
        (request.headers.cookie || "")
          .split(";")
          .filter(Boolean)
          .map((c) => c.trim().split("=")),
      );
      if (request.url === "/auth/refresh") {
        if (state.failRefresh)
          return json(response, 503, { message: "Temporary outage" });
        if (state.revoked || cookies.coms_refresh !== state.refresh)
          return json(response, 401, { message: "Refresh rejected" });
        await sleep(150);
        state.rotations++;
        state.access = "fixture-access-" + state.rotations;
        state.refresh = "fixture-refresh-" + state.rotations;
        state.expired = false;
        return json(response, 200, { user }, [
          `coms_access=${state.access}; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600`,
          `coms_refresh=${state.refresh}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`,
        ]);
      }
      if (state.expired || cookies.coms_access !== state.access)
        return json(response, 401, { message: "Access expired" });
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
      response.writeHead(upstream.status, {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      json(response, 500, { message: "Fixture failure" });
    }
  });
  const apiPort = await listen(proxy);
  const portProbe = http.createServer();
  const port = await listen(portProbe);
  await new Promise((resolve) => portProbe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      String(port),
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
  server.stdout.on("data", (chunk) => {
    output = (output + chunk).slice(-8000);
  });
  server.stderr.on("data", (chunk) => {
    output = (output + chunk).slice(-8000);
  });
  await until(async () => {
    try {
      return (await fetch(origin)).status < 500;
    } catch {
      return false;
    }
  }, "Next did not start");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  context.setDefaultTimeout(15_000);
  await context.addCookies([
    {
      name: "coms_access",
      value: state.access,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "coms_refresh",
      value: state.refresh,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(origin + "/stock-items");
  await page
    .getByRole("heading", { name: "Stock Items", exact: true })
    .last()
    .waitFor();
  await page.evaluate(() => {
    window.__sessionDocument = "preserved";
  });
  await page.getByRole("button", { name: /add stock item/i }).click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("textbox").first();
  await input.fill("Unsaved chicken stock");
  state.expired = true;
  await page.clock.runFor(61_000);
  await until(
    () => state.rotations === 1,
    "Visible idle page did not rotate its session",
  );
  await until(
    async () =>
      (await context.cookies()).some(
        (c) => c.name === "coms_access" && c.value === state.access,
      ),
    "Rotated cookie was not relayed",
  );
  assert.equal(
    await page.evaluate(() => window.__sessionDocument),
    "preserved",
  );
  assert.equal(await input.inputValue(), "Unsaved chicken stock");
  console.log(
    "PASS idle expiry rotates automatically without document reload or losing form input",
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  // Discard confirmation is only present if the form implements dirty guarding.
  const discard = page.getByRole("button", { name: /discard/i });
  if (await discard.isVisible()) await discard.click();

  const second = await context.newPage();
  const hydratedCheck = second.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      !!response.request().headers()["next-action"],
  );
  await second.goto(origin + "/products");
  await second
    .getByRole("heading", { name: "Products", exact: true })
    .last()
    .waitFor();
  await hydratedCheck;
  await second.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  state.expired = true;
  await Promise.all(
    [page, second].map((tab) =>
      tab.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          value: "hidden",
        });
        document.dispatchEvent(
          new Event("visibilitychange", { bubbles: true }),
        );
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          value: "visible",
        });
        document.dispatchEvent(
          new Event("visibilitychange", { bubbles: true }),
        );
      }),
    ),
  );
  await until(
    () => state.rotations >= 2,
    "Returning to the app did not recover",
  );
  await sleep(500);
  assert.equal(state.rotations, 2);
  assert.equal(state.revoked, false);
  console.log("PASS two tabs coordinate one refresh rotation on focus");

  state.expired = true;
  state.failRefresh = true;
  await page.goto(origin + "/stock-items");
  await page
    .getByRole("heading", { name: "Session recovery failed" })
    .waitFor();
  state.failRefresh = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByRole("heading", { name: "Stock Items", exact: true })
    .last()
    .waitFor();
  assert.equal(state.rotations, 3);
  console.log(
    "PASS retry after refresh outage recovers the page without a reload",
  );

  state.expired = true;
  state.revoked = true;
  await second.close();
  await page.clock.runFor(61_000);
  await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
  assert.equal(state.rotations, 3);
  console.log(
    "PASS genuinely revoked refresh session returns to sign-in without a retry loop",
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      if (process.platform === "win32")
        await new Promise((resolve) => {
          const killer = spawn(
            "taskkill",
            ["/pid", String(server.pid), "/t", "/f"],
            { windowsHide: true, stdio: "ignore" },
          );
          killer.on("exit", resolve);
        });
      else server.kill();
    }
    if (proxy) {
      proxy.closeAllConnections();
      await new Promise((resolve) => proxy.close(resolve));
    }
    if (fixture) await fixture.close();
  });
