// Run against coms-api/test/browser-fixture.cjs. Never points at a real account database.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("../../coms-api/node_modules/pg");
const cache = path.resolve("../coms-api/node_modules/.cache/coms-auth-browser");
const fixture = JSON.parse(fs.readFileSync(path.join(cache, "fixture.json")));
assert.match(
  new URL(fixture.databaseUrl).pathname,
  /^\/coms_auth_browser_[a-f0-9]{32}$/,
);
const db = new Pool({ connectionString: fixture.databaseUrl });
const outage = path.join(cache, "outage");
let browser;
let activePage;
const pageErrors = [];

async function check(label, work) {
  await work();
  console.log(`PASS ${label}`);
}
async function login(page) {
  await page.goto(fixture.origin);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(fixture.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(fixture.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByRole("button", { name: /Browser Test/ }).waitFor();
}
async function logout(page, keyboard = false) {
  await page.getByRole("button", { name: /Browser Test/ }).click();
  const item = page.getByRole("menuitem", { name: "Log out", exact: true });
  if (keyboard) {
    await item.focus();
    await page.keyboard.press("Enter");
  } else await item.click();
}
async function waitLogin(page) {
  await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
}
async function historyCount() {
  return Number(
    (
      await db.query(
        "SELECT count(*) AS count FROM auth.refresh_tokens WHERE consumed_at IS NOT NULL",
      )
    ).rows[0].count,
  );
}

(async () => {
  const roleResult = await db.query(
    `UPDATE auth.users
     SET role_id = (SELECT id FROM auth.roles WHERE code = 'SUPER_ADMIN')
     WHERE email = $1
     RETURNING id`,
    [fixture.email],
  );
  assert.equal(roleResult.rowCount, 1);
  await db.query("DELETE FROM auth.refresh_tokens");
  await db.query("DELETE FROM auth.token_families");
  await db.query("DELETE FROM auth.rate_limit_buckets");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  });
  context.on("page", (page) =>
    page.on("pageerror", (error) => pageErrors.push(error.message)),
  );
  const first = await context.newPage();
  activePage = first;
  const second = await context.newPage();

  await check(
    "direct protected access and accessible invalid-credentials error",
    async () => {
      await first.goto(`${fixture.origin}/dashboard`);
      await waitLogin(first);
      await first
        .getByRole("textbox", { name: "Email", exact: true })
        .fill(fixture.email);
      await first
        .getByRole("textbox", { name: "Password", exact: true })
        .fill("wrong password");
      await first.getByRole("button", { name: "Sign In", exact: true }).click();
      await first
        .getByRole("alert")
        .filter({ hasText: /email or password/i })
        .waitFor();
    },
  );
  await check(
    "HTTPS login, refresh/reload, and HttpOnly production cookie attributes",
    async () => {
      await login(first);
      const cookies = (await context.cookies()).filter((cookie) =>
        cookie.name.startsWith("__Host-coms_"),
      );
      assert.equal(cookies.length, 2);
      assert(
        cookies.every(
          (cookie) =>
            cookie.secure &&
            cookie.httpOnly &&
            cookie.path === "/" &&
            cookie.sameSite === "Lax",
        ),
      );
      assert.equal(
        await first.evaluate(() => document.cookie.includes("coms_access")),
        false,
      );
      await first.reload();
      await first.getByRole("button", { name: /Browser Test/ }).waitFor();
    },
  );
  await check(
    "client navigation preserves the document and collapsed sidebar through back and forward",
    async () => {
      const documentIdentity = await first.evaluate(() => {
        const sidebar = document.querySelector('[data-slot="sidebar"]');
        if (!sidebar) return null;
        const id = crypto.randomUUID();
        Object.defineProperty(window, "__comsDocumentIdentity", {
          value: { id, sidebar },
          configurable: true,
        });
        return id;
      });
      assert(documentIdentity);

      const assertShellIdentity = async (sidebarState, scrollTop) => {
        const identity = await first.evaluate(
          ({ expectedId }) => {
            const identity = window.__comsDocumentIdentity;
            return {
              sameDocument: identity?.id === expectedId,
              sameSidebar:
                identity?.sidebar ===
                document.querySelector('[data-slot="sidebar"]'),
              sidebarState: document
                .querySelector('[data-slot="sidebar"]')
                ?.getAttribute("data-state"),
              scrollTop: document
                .querySelector('[data-slot="sidebar-content"]')
                ?.scrollTop,
            };
          },
          { expectedId: documentIdentity },
        );
        assert.equal(identity.sameDocument, true);
        assert.equal(identity.sameSidebar, true);
        assert.equal(identity.sidebarState, sidebarState);
        if (scrollTop !== undefined) assert.equal(identity.scrollTop, scrollTop);
      };

      await first.getByRole("link", { name: "Receiving" }).click();
      await first.waitForURL("**/receipts");
      await first.getByRole("heading", { name: "Receiving", exact: true }).waitFor();

      let releaseSuppliersResponse;
      let markSuppliersResponseStarted;
      const suppliersResponseGate = new Promise((resolve) => {
        releaseSuppliersResponse = resolve;
      });
      const suppliersResponseStarted = new Promise((resolve) => {
        markSuppliersResponseStarted = resolve;
      });
      await first.route("**/suppliers**", async (route) => {
        if (route.request().headers().rsc === "1") {
          markSuppliersResponseStarted();
          await suppliersResponseGate;
        }
        await route.continue();
      });
      const suppliersNavigation = first
        .getByRole("link", { name: "Suppliers" })
        .click();
      const suppliersRequestStarted = await Promise.race([
        suppliersResponseStarted.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
      ]);
      assert.equal(suppliersRequestStarted, true, "expected an RSC navigation request");
      await assertShellIdentity("expanded");
      assert(await first.getByRole("link", { name: "Receiving" }).isVisible());
      releaseSuppliersResponse();
      await suppliersNavigation;
      await first.unroute("**/suppliers**");
      await first.waitForURL("**/suppliers");
      await first.getByRole("heading", { name: "Suppliers", exact: true }).waitFor();
      await assertShellIdentity("expanded");
      await first
        .getByRole("main")
        .getByRole("alert")
        .filter({ hasText: /COMS could not load suppliers/i })
        .waitFor();

      await first.setViewportSize({ width: 1440, height: 560 });
      const maxSidebarScroll = await first.evaluate(() => {
        const content = document.querySelector('[data-slot="sidebar-content"]');
        if (!content) return -1;
        const maxScroll = content.scrollHeight - content.clientHeight;
        content.scrollTop = maxScroll;
        return maxScroll;
      });
      assert(maxSidebarScroll > 0, "short viewport should make sidebar scrollable");
      await assertShellIdentity("expanded", maxSidebarScroll);

      let releaseRolesResponse;
      let markRolesResponseStarted;
      const rolesResponseGate = new Promise((resolve) => {
        releaseRolesResponse = resolve;
      });
      const rolesResponseStarted = new Promise((resolve) => {
        markRolesResponseStarted = resolve;
      });
      await first.route("**/roles**", async (route) => {
        if (route.request().headers().rsc === "1") {
          markRolesResponseStarted();
          await rolesResponseGate;
        }
        await route.continue();
      });
      const rolesNavigation = first
        .getByRole("link", { name: "Roles", exact: true })
        .click();
      const rolesRequestStarted = await Promise.race([
        rolesResponseStarted.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
      ]);
      assert.equal(rolesRequestStarted, true, "expected an RSC navigation request");
      await assertShellIdentity("expanded", maxSidebarScroll);
      assert(await first.getByRole("link", { name: "Suppliers" }).isVisible());
      releaseRolesResponse();
      await rolesNavigation;
      await first.unroute("**/roles**");
      await first.waitForURL("**/roles");
      await first.getByRole("heading", { name: "Roles and permissions" }).waitFor();
      await assertShellIdentity("expanded", maxSidebarScroll);

      await first.getByRole("button", { name: "Toggle Sidebar" }).click();
      await first.waitForFunction(
        () =>
          document
            .querySelector('[data-slot="sidebar"]')
            ?.getAttribute("data-state") === "collapsed",
      );

      await first.goBack();
      await first.waitForURL("**/suppliers");
      await first.getByRole("heading", { name: "Suppliers", exact: true }).waitFor();
      await assertShellIdentity("collapsed", maxSidebarScroll);
      await first.goForward();
      await first.waitForURL("**/roles");
      await first.getByRole("heading", { name: "Roles and permissions" }).waitFor();
      await assertShellIdentity("collapsed", maxSidebarScroll);

      await first.setViewportSize({ width: 390, height: 844 });
      assert(
        await first.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await first.getByRole("button", { name: "Toggle Sidebar" }).click();
      const mobileReceivingLink = first.locator('a[href="/receipts"]').last();
      await mobileReceivingLink.waitFor({ state: "visible" });
      await mobileReceivingLink.focus();
      await first.keyboard.press("Enter");
      await first.waitForURL("**/receipts");
      await first.getByRole("heading", { name: "Receiving", exact: true }).waitFor();
      await mobileReceivingLink.waitFor({ state: "hidden" });
      assert(
        await first.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await first.setViewportSize({ width: 1440, height: 900 });
      await first.getByRole("button", { name: "Toggle Sidebar" }).click();
      await first.getByRole("button", { name: /Browser Test/ }).waitFor();
    },
  );
  await check(
    "two-tab simultaneous recovery performs one rotation and keeps both authenticated",
    async () => {
      await second.goto(`${fixture.origin}/dashboard`);
      const before = await historyCount();
      await context.clearCookies({ name: "__Host-coms_access" });
      await Promise.all([first.reload(), second.reload()]);
      await Promise.all([
        first.getByRole("button", { name: /Browser Test/ }).waitFor(),
        second.getByRole("button", { name: /Browser Test/ }).waitFor(),
      ]);
      assert.equal(await historyCount(), before + 1);
      const { rows } = await db.query(
        "SELECT revoked_at FROM auth.token_families",
      );
      assert(rows.every((row) => row.revoked_at === null));
    },
  );
  await check(
    "keyboard logout broadcasts to the other tab and deletes both production cookies",
    async () => {
      await logout(first, true);
      await Promise.all([waitLogin(first), waitLogin(second)]);
      assert.equal(
        (await context.cookies()).filter((cookie) =>
          /coms_(access|refresh)/.test(cookie.name),
        ).length,
        0,
      );
    },
  );
  await check(
    "logout failure retains the session and accessible retry succeeds",
    async () => {
      await login(first);
      fs.writeFileSync(outage, "1");
      await logout(first);
      await first
        .getByRole("alert")
        .filter({ hasText: "Sign out failed. Try again." })
        .waitFor();
      assert.equal(
        (await context.cookies()).filter((cookie) =>
          cookie.name.startsWith("__Host-coms_"),
        ).length,
        2,
      );
      fs.rmSync(outage);
      await first
        .getByRole("menuitem", { name: "Sign out failed. Try again." })
        .click();
      await waitLogin(first);
    },
  );
  await check(
    "rejected recovery on the login route clears cookies and renders login repeatedly",
    async () => {
      await login(first);
      await context.clearCookies({ name: "__Host-coms_access" });
      await db.query(
        "UPDATE auth.token_families SET expires_at = now() - interval '1 second'",
      );
      await first.goto(fixture.origin);
      await waitLogin(first);
      assert.equal(
        (await context.cookies()).filter((cookie) =>
          cookie.name.startsWith("__Host-coms_"),
        ).length,
        0,
      );
      await first.reload();
      await waitLogin(first);
    },
  );
  await check(
    "refresh racing logout ends signed out without reviving the family",
    async () => {
      await login(first);
      await second.goto(`${fixture.origin}/dashboard`);
      await context.clearCookies({ name: "__Host-coms_access" });
      await Promise.all([first.reload(), logout(second)]);
      await Promise.all([waitLogin(first), waitLogin(second)]);
      assert.equal(
        (await context.cookies()).filter((cookie) =>
          cookie.name.startsWith("__Host-coms_"),
        ).length,
        0,
      );
    },
  );
  await check(
    "unsupported Web Locks offers sign-in again and completes logout",
    async () => {
      await login(first);
      await context.clearCookies({ name: "__Host-coms_access" });
      const unsupported = await context.newPage();
      await unsupported.addInitScript(() =>
        Object.defineProperty(navigator, "locks", { value: undefined }),
      );
      await unsupported.goto(`${fixture.origin}/dashboard`);
      await unsupported
        .getByRole("button", { name: "Sign in again", exact: true })
        .click();
      await waitLogin(unsupported);
      assert.equal(
        (await context.cookies()).filter((cookie) =>
          cookie.name.startsWith("__Host-coms_"),
        ).length,
        0,
      );
      await unsupported.close();
    },
  );
  await check(
    "lost refresh response is not automatically replayed and explicit retry revokes the family",
    async () => {
      await login(first);
      await context.clearCookies({ name: "__Host-coms_access" });
      const oldCookies = await context.cookies();
      const before = await historyCount();
      let dropped = false;
      await first.route("**/*", async (route) => {
        if (
          !dropped &&
          route.request().method() === "POST" &&
          route.request().headers()["next-action"]
        ) {
          dropped = true;
          await route.fetch();
          // Keep the browser's original cookies, as if the response never arrived.
          await context.clearCookies();
          await context.addCookies(oldCookies);
          await route.abort("connectionreset");
        } else await route.continue();
      });
      await first.reload();
      await first
        .getByRole("alert")
        .filter({ hasText: /could not reach/i })
        .waitFor();
      assert.equal(await historyCount(), before + 1);
      await first.unroute("**/*");
      await first
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await waitLogin(first);
      const { rows } = await db.query(
        "SELECT revoked_at FROM auth.token_families ORDER BY created_at DESC LIMIT 1",
      );
      assert(rows[0].revoked_at !== null);
    },
  );
  await check(
    "responsive login has no horizontal overflow and supports keyboard submit",
    async () => {
      await first.setViewportSize({ width: 390, height: 844 });
      await first.goto(fixture.origin);
      assert(
        await first.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await first
        .getByRole("textbox", { name: "Email", exact: true })
        .fill(fixture.email);
      await first
        .getByRole("textbox", { name: "Password", exact: true })
        .fill(fixture.password);
      await first.getByRole("button", { name: "Sign In", exact: true }).focus();
      await first.keyboard.press("Enter");
      await first.waitForURL("**/dashboard");
      await first.screenshot({
        path: path.join(cache, "mobile-dashboard.png"),
      });
    },
  );
  assert.deepEqual(pageErrors, []);
  console.log("PASS browser console has no uncaught page errors");
})()
  .catch(async (error) => {
    console.error(error.message);
    if (activePage) {
      console.error(
        (await activePage.locator("body").innerText()).slice(0, 1200),
      );
      await activePage.screenshot({ path: path.join(cache, "failure.png") });
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    fs.rmSync(outage, { force: true });
    if (browser) await browser.close();
    await db.end();
  });
