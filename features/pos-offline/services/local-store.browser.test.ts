import { afterAll, beforeAll, expect, test } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

let browser: Browser;
let server: Server;
let origin: string;
let bundle: string;
beforeAll(async () => {
  const files = [
    "offline-types",
    "local-validation",
    "local-database",
    "local-store",
    "sync-client",
  ];
  const modules = files.map((name) => {
    const code = ts.transpileModule(
      readFileSync(resolve(`features/pos-offline/services/${name}.ts`), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText;
    return `${JSON.stringify(`./${name}`)}: function(require, exports) { ${code}\n }`;
  });
  bundle = `(() => { const modules = {${modules.join(",")}}; const cache = {}; function require(id) { if (!cache[id]) { cache[id] = {}; modules[id](require, cache[id]); } return cache[id]; } window.offline = {...require('./local-store'), ...require('./sync-client')}; })();`;
  server = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end("<!doctype html><title>Offline storage test</title>");
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test address");
  origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
  });
}, 30000);
afterAll(async () => {
  await browser?.close();
  // Keep-alive sockets from the browser otherwise hold close() open under load.
  server?.closeAllConnections();
  await new Promise<void>((done) => server?.close(() => done()));
}, 30000);

async function setup(page: Page) {
  await page.goto(origin);
  await page.addScriptTag({ content: bundle });
  await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    w.now = Date.parse("2026-10-26T02:00:00Z");
    w.makeStore = () =>
      w.offline.createLocalPosStore({
        now: () => w.now,
        storage: { persisted: async () => true, persist: async () => true },
      });
    w.store = w.makeStore();
    const id = (n: number) =>
      `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    w.scope = {
      cashier_id: id(1),
      device_id: await w.store.getDeviceId(),
      branch_id: id(2),
      shift_id: id(3),
    };
    w.prepared = {
      session: {
        ...w.scope,
        id: id(4),
        issued_at: new Date(w.now).toISOString(),
        server_time: new Date(w.now).toISOString(),
        cutoff_at: "2026-10-26T10:00:00Z",
        business_date: "2026-10-26",
      },
      snapshot: {
        id: id(5),
        products: [
          {
            id: id(6),
            name: "Chicken",
            sku: "CH",
            category_id: id(7),
            category_name: "Meals",
            price: "10.25",
            price_revision: 1,
            supports_dine_in: true,
            supports_takeaway: true,
          },
        ],
        cash_payment_method: { id: id(8), name: "Cash" },
        branch: {
          id: id(2),
          name: "Banilad",
          supports_dine_in: true,
          supports_takeaway: true,
        },
      },
    };
    w.validate = async () => ({ user_id: w.scope.cashier_id, enabled: true });
    await w.store.prepare(w.prepared, w.validate);
    w.cart = {
      service_type: "DINE_IN",
      items: [{ product_id: id(6), quantity: "2" }],
    };
  });
}

// Browser-side test globals stay typed against the real public API.
type Core = typeof import("./local-store");
type Sync = typeof import("./sync-client");
type Types = import("./offline-types").OfflinePrepareResponse;
interface TestWindow {
  offline: Core & Sync;
  store: ReturnType<Core["createLocalPosStore"]>;
  makeStore: () => TestWindow["store"];
  now: number;
  scope: import("./offline-types").OfflineScope;
  prepared: Types;
  validate: () => Promise<{ user_id: string; enabled: boolean }>;
  cart: import("./offline-types").OfflineCartInput;
}

test("cart, immutable outbox and sequence survive reopen; stale checkout cannot double charge", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    const cart = await w.store.saveCart(w.scope, w.cart, 0);
    w.store.close();
    w.store = w.makeStore();
    const restored = await w.store.read(w.scope);
    const sale = await w.store.checkout(w.scope, {
      cart_revision: cart.revision,
      cash_tendered: "30",
    });
    let stale = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: cart.revision,
        cash_tendered: "30",
      });
    } catch (e) {
      stale = (e as Error).message;
    }
    w.store.close();
    w.store = w.makeStore();
    return { restored, sale, stale, final: await w.store.read(w.scope) };
  });
  expect(result.restored.cart.items).toHaveLength(1);
  expect(result.sale.envelope.total_amount).toBe("20.5");
  expect(result.sale.envelope.sequence).toBe(1);
  expect(result.stale).toContain("CART_CHANGED");
  expect(result.final.records).toHaveLength(1);
  expect(result.final.cart.items).toEqual([]);
  await context.close();
});

test("logout preserves records, blocks another cashier, requires online validation to unlock", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    await w.store.lock();
    const errors: string[] = [];
    for (const action of [
      () => w.store.read(w.scope),
      () =>
        w.store.unlock(w.scope, async () => ({
          user_id: crypto.randomUUID(),
          enabled: true,
        })),
      () =>
        w.store.unlock(w.scope, async () => {
          throw new Error("offline");
        }),
    ]) {
      try {
        await action();
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    await w.store.unlock(w.scope, w.validate);
    return { errors, records: (await w.store.read(w.scope)).records };
  });
  expect(result.errors).toHaveLength(3);
  expect(result.records).toHaveLength(1);
  await context.close();
});

test("cutoff and rollback block checkout but retain recovery data", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    w.now -= 10000;
    let rollback = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: 1,
        cash_tendered: "30",
      });
    } catch (e) {
      rollback = (e as Error).message;
    }
    w.now = Date.parse("2026-10-26T10:00:00Z");
    let cutoff = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: 1,
        cash_tendered: "30",
      });
    } catch (e) {
      cutoff = (e as Error).message;
    }
    return {
      rollback,
      cutoff,
      recovery: await w.store.exportRecovery(w.scope),
    };
  });
  expect(result.rollback).toContain("CLOCK_ROLLBACK");
  expect(result.cutoff).toMatch(/CUTOFF|CLOCK_ROLLBACK/);
  expect(result.recovery.schema_version).toBe(1);
  expect(result.recovery.cart.items).toHaveLength(1);
  await context.close();
});

test("sync preserves missing results, holds review records, and never rewrites acknowledged envelopes", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    for (let i = 0; i < 3; i++) {
      const state = await w.store.read(w.scope);
      const cart = await w.store.saveCart(w.scope, w.cart, state.cart.revision);
      await w.store.checkout(w.scope, {
        cart_revision: cart.revision,
        cash_tendered: "30",
      });
    }
    const before = await w.store.exportRecovery(w.scope);
    const sent: unknown[] = [];
    const sync = await w.offline.syncOfflineSession(w.store, w.scope, {
      maxBatches: 1,
      fetch: async (url, init) => {
        sent.push({ url, body: JSON.parse(init!.body as string) });
        return new Response(
          JSON.stringify({
            results: [
              {
                id: before.records[0].envelope.id,
                status: "ACKNOWLEDGED",
                sale_id: crypto.randomUUID(),
              },
              {
                id: before.records[1].envelope.id,
                status: "NEEDS_REVIEW",
                reason: "Closed shift",
              },
            ],
          }),
          { status: 200 },
        );
      },
    });
    await w.store.importRecovery(w.scope, before);
    return { before, after: await w.store.read(w.scope), sent, sync };
  });
  expect(result.after.records.map((r) => r.status)).toEqual([
    "ACKNOWLEDGED",
    "NEEDS_REVIEW",
    "PENDING",
  ]);
  expect(result.after.records.map((r) => r.envelope)).toEqual(
    result.before.records.map((r) => r.envelope),
  );
  expect(result.sent).toHaveLength(1);
  expect(result.before.final_sequence).toBe(3);
  await context.close();
});

test("failed durable commit preserves cart and sequence; success survives a real page reload", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (typeof key === "string" && key.startsWith("scope:"))
        throw new DOMException("Simulated full disk", "QuotaExceededError");
      return original.call(this, value, key);
    };
    let failed = false;
    try {
      await w.store.checkout(w.scope, {
        cart_revision: 1,
        cash_tendered: "30",
      });
    } catch {
      failed = true;
    } finally {
      IDBObjectStore.prototype.put = original;
    }
    const afterFailure = await w.store.read(w.scope);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    return { failed, afterFailure, scope: w.scope, now: w.now };
  });
  expect(result.failed).toBe(true);
  expect(result.afterFailure.records).toEqual([]);
  expect(result.afterFailure.cart.revision).toBe(1);
  expect(result.afterFailure.next_sequence).toBe(1);
  await page.reload();
  await page.addScriptTag({ content: bundle });
  const recovered = await page.evaluate(async ({ scope, now }) => {
    const w = window as unknown as TestWindow;
    return w.offline.createLocalPosStore({ now: () => now }).read(scope);
  }, result);
  expect(recovered.records).toHaveLength(1);
  expect(recovered.records[0].envelope.sequence).toBe(1);
  expect(recovered.cart.items).toEqual([]);
  await context.close();
});

test("persistence denial, missing Web Locks and IDB write failure fail closed at prepare", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const errors = await page.evaluate(async () => {
    const w = window as unknown as TestWindow,
      errors: string[] = [];
    try {
      w.offline.createLocalPosStore({ locks: {} as LockManager });
    } catch (e) {
      errors.push((e as Error).message);
    }
    const denied = w.offline.createLocalPosStore({
      storage: { persist: async () => false, persisted: async () => false },
    });
    try {
      await denied.prepare(w.prepared, w.validate);
    } catch (e) {
      errors.push((e as Error).message);
    }
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (key === "probe") throw new DOMException("Read only", "ReadOnlyError");
      return put.call(this, value, key);
    };
    try {
      await w.store.prepare(w.prepared, w.validate);
    } catch (e) {
      errors.push((e as Error).name);
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    return errors;
  });
  expect(errors).toEqual([
    "UNSUPPORTED",
    "STORAGE_NOT_PERSISTENT",
    "ReadOnlyError",
  ]);
  await context.close();
});

test("another tab cannot write while writer lock is held and observes durable logout", async () => {
  const context = await browser.newContext();
  const first = await context.newPage();
  await setup(first);
  const scope = await first.evaluate(
    () => (window as unknown as TestWindow).scope,
  );
  const second = await context.newPage();
  await second.goto(origin);
  await second.addScriptTag({ content: bundle });
  await first.evaluate(() => {
    const w = window as unknown as { releaseWriter: () => void };
    void navigator.locks.request(
      "coms-pos-offline-v1:writer",
      () =>
        new Promise<void>((resolve) => {
          w.releaseWriter = resolve;
        }),
    );
  });
  await first.waitForFunction(() =>
    Boolean((window as unknown as { releaseWriter?: unknown }).releaseWriter),
  );
  const busy = await second.evaluate(async (scope) => {
    const w = window as unknown as TestWindow;
    w.store = w.offline.createLocalPosStore();
    try {
      await w.store.saveCart(scope, { service_type: "DINE_IN", items: [] }, 0);
      return "incorrect success";
    } catch (e) {
      return (e as Error).message;
    }
  }, scope);
  expect(busy).toBe("BUSY");
  await first.evaluate(() =>
    (window as unknown as { releaseWriter: () => void }).releaseWriter(),
  );
  await first.evaluate(async () => {
    await (window as unknown as TestWindow).store.lock();
  });
  const locked = await second.evaluate(async (scope) => {
    try {
      await (window as unknown as TestWindow).store.read(scope);
      return "incorrect success";
    } catch (e) {
      return (e as Error).message;
    }
  }, scope);
  expect(locked).toBe("LOCKED");
  await context.close();
});

test("lost response retries identical UUID envelopes with exponential backoff; 401 preserves and locks queue", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    const bodies: string[] = [],
      delays: number[] = [];
    const outcome = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => true,
      sleep: async (ms) => {
        delays.push(ms);
      },
      fetch: async (_, init) => {
        bodies.push(init!.body as string);
        if (bodies.length < 3)
          throw new TypeError("Connection lost after server commit");
        return new Response("{}", { status: 401 });
      },
    });
    let locked = "";
    try {
      await w.store.read(w.scope);
    } catch (e) {
      locked = (e as Error).message;
    }
    await w.store.unlock(w.scope, w.validate);
    return {
      bodies,
      delays,
      outcome,
      locked,
      state: await w.store.read(w.scope),
    };
  });
  expect(new Set(result.bodies).size).toBe(1);
  expect(result.delays).toEqual([500, 1000]);
  expect(result.outcome.status).toBe("AUTH_PAUSED");
  expect(result.locked).toBe("LOCKED");
  expect(result.state.records[0].status).toBe("PENDING");
  await context.close();
});

test("recovery rejects other scopes, envelope edits, unknown secret fields and conflicting sequences atomically", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    const recovery = await w.store.exportRecovery(w.scope),
      failures: string[] = [];
    const changedScope = structuredClone(recovery);
    changedScope.scope.cashier_id = crypto.randomUUID();
    const edited = structuredClone(recovery);
    edited.records[0].envelope.total_amount = "1";
    const conflict = structuredClone(recovery);
    conflict.records[0].envelope.id = crypto.randomUUID();
    for (const input of [
      changedScope,
      edited,
      { ...recovery, token: "must-never-be-stored" },
      conflict,
    ]) {
      try {
        await w.store.importRecovery(w.scope, input);
      } catch (e) {
        failures.push((e as Error).message);
      }
    }
    return { failures, recovery, after: await w.store.exportRecovery(w.scope) };
  });
  expect(result.failures).toHaveLength(4);
  expect(result.after).toEqual(result.recovery);
  await context.close();
});

test("server offset enforces cutoff regardless of local time zone; prepare cannot extend an existing session", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    const altered = structuredClone(w.prepared);
    altered.session.cutoff_at = "2026-10-27T10:00:00Z";
    let replacement = "";
    try {
      await w.store.prepare(altered, w.validate);
    } catch (e) {
      replacement = (e as Error).message;
    }
    await w.store.saveCart(w.scope, w.cart, 0);
    w.now = Date.parse(w.prepared.session.cutoff_at);
    let expired = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: 1,
        cash_tendered: "30",
      });
    } catch (e) {
      expired = (e as Error).message;
    }
    return { replacement, expired, state: await w.store.read(w.scope) };
  });
  expect(result.replacement).toBe("CONFLICT");
  expect(result.expired).toBe("CUTOFF");
  expect(result.state.records).toEqual([]);
  expect(result.state.cart.items).toHaveLength(1);
  await context.close();
});

test("sealing freezes the final sequence durably while allowing queued envelopes to sync", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    const final = await w.store.sealForFinalization(w.scope);
    w.store.close();
    w.store = w.makeStore();
    let error = "";
    try {
      await w.store.saveCart(w.scope, w.cart, 2);
    } catch (e) {
      error = (e as Error).message;
    }
    const outcome = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => true,
      fetch: async (_, init) => {
        const body = JSON.parse(init!.body as string);
        return new Response(
          JSON.stringify({
            results: body.transactions.map((t: { id: string }) => ({
              id: t.id,
              status: "ACKNOWLEDGED",
            })),
          }),
        );
      },
    });
    return { final, error, outcome };
  });
  expect(result.final.final_sequence).toBe(1);
  expect(result.error).toBe("SESSION_SEALED");
  expect(result.outcome.status).toBe("COMPLETE");
  await context.close();
});

test("sync timeout is bounded, hidden tabs pause, and overlapping session sync is excluded", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    let calls = 0;
    const timeout = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => true,
      maxAttempts: 2,
      requestTimeoutMs: 5,
      sleep: async () => {},
      fetch: async (_, init) => {
        calls++;
        return new Promise<Response>((_, reject) =>
          init!.signal!.addEventListener(
            "abort",
            () => reject(init!.signal!.reason),
            { once: true },
          ),
        );
      },
    });
    const hidden = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => false,
      fetch: async () => {
        throw new Error("Should not fetch");
      },
    });
    const busy = await w.store.withSyncLock(w.scope, () =>
      w.offline.syncOfflineSession(w.store, w.scope, {
        isForeground: () => true,
      }),
    );
    return { calls, timeout, hidden, busy, state: await w.store.read(w.scope) };
  });
  expect(result.calls).toBe(2);
  expect(result.timeout.status).toBe("PARTIAL");
  expect(result.hidden.status).toBe("PAUSED");
  expect(result.busy.status).toBe("BUSY");
  expect(result.state.records[0].status).toBe("PENDING");
  await context.close();
});

test("foreign ACKs and late ACKs after logout cannot alter the durable queue", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    const record = await w.store.checkout(w.scope, {
      cart_revision: 1,
      cash_tendered: "30",
    });
    let invalid = "";
    try {
      await w.offline.syncOfflineSession(w.store, w.scope, {
        isForeground: () => true,
        fetch: async () =>
          new Response(
            JSON.stringify({
              results: [{ id: crypto.randomUUID(), status: "ACKNOWLEDGED" }],
            }),
          ),
      });
    } catch (e) {
      invalid = (e as Error).message;
    }
    const late = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => true,
      fetch: async () => {
        await w.store.lock();
        return new Response(
          JSON.stringify({
            results: [{ id: record.envelope.id, status: "ACKNOWLEDGED" }],
          }),
        );
      },
    });
    await w.store.unlock(w.scope, w.validate);
    return { invalid, late, state: await w.store.read(w.scope) };
  });
  expect(result.invalid).toBe("INVALID_DATA");
  expect(result.late.status).toBe("AUTH_PAUSED");
  expect(result.state.records[0].status).toBe("PENDING");
  await context.close();
});

test("imported ACK claims are replayed unchanged and a recovery watermark prevents sequence reuse", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    const recovery = await w.store.exportRecovery(w.scope);
    recovery.records[0].envelope.id = crypto.randomUUID();
    recovery.records[0].envelope.sequence = 2;
    recovery.records[0].status = "ACKNOWLEDGED";
    recovery.final_sequence = 7;
    await w.store.importRecovery(w.scope, recovery);
    const imported = await w.store.read(w.scope);
    const cart = await w.store.saveCart(
      w.scope,
      w.cart,
      imported.cart.revision,
    );
    const next = await w.store.checkout(w.scope, {
      cart_revision: cart.revision,
      cash_tendered: "30",
    });
    return { imported, next, recovery };
  });
  expect(result.imported.records[1].status).toBe("PENDING");
  expect(result.imported.records[1].envelope).toEqual(
    result.recovery.records[0].envelope,
  );
  expect(result.next.envelope.sequence).toBe(8);
  await context.close();
});

test("feature disabled still permits same-cashier unlock and queue drain, while blocking new sales", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    await w.store.checkout(w.scope, { cart_revision: 1, cash_tendered: "30" });
    await w.store.lock();
    await w.store.unlock(w.scope, async () => ({
      user_id: w.scope.cashier_id,
      enabled: false,
    }));
    let disabled = "";
    try {
      await w.store.saveCart(w.scope, w.cart, 2);
    } catch (e) {
      disabled = (e as Error).message;
    }
    return { disabled, batch: await w.store.pendingBatch(w.scope, 25) };
  });
  expect(result.disabled).toBe("OFFLINE_DISABLED");
  expect(result.batch.transactions).toHaveLength(1);
  await context.close();
});

test("preflight fails before server reservation and repeated prepare tolerates a fresh server_time", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    const denied = w.offline.createLocalPosStore({
      storage: { persisted: async () => false, persist: async () => false },
    });
    let preflight = "";
    try {
      await denied.preflight();
    } catch (e) {
      preflight = (e as Error).message;
    }
    await w.store.saveCart(w.scope, w.cart, 0);
    const before = await w.store.read(w.scope);
    const retry = structuredClone(w.prepared);
    retry.session.server_time = "2026-10-26T02:00:01Z";
    await w.store.prepare(retry, w.validate);
    return { preflight, before, after: await w.store.read(w.scope) };
  });
  expect(result.preflight).toBe("STORAGE_NOT_PERSISTENT");
  expect(result.after.cart).toEqual(result.before.cart);
  expect(result.after.clock).toEqual(result.before.clock);
  await context.close();
});

test("snapshot refresh rejects unfinished carts and preserves old envelope versions through recovery", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    await w.store.saveCart(w.scope, w.cart, 0);
    const refresh = structuredClone(w.prepared);
    refresh.snapshot.id = crypto.randomUUID();
    refresh.snapshot.products[0].price = "20.5";
    refresh.snapshot.products[0].price_revision = 2;
    let dirty = "";
    try {
      await w.store.refreshSnapshot(w.scope, refresh, w.validate);
    } catch (e) {
      dirty = (e as Error).message;
    }
    const old = await w.store.checkout(w.scope, {
      cart_revision: 1,
      cash_tendered: "30",
    });
    await w.store.refreshSnapshot(w.scope, refresh, w.validate);
    const current = await w.store.read(w.scope);
    const cart = await w.store.saveCart(w.scope, w.cart, current.cart.revision);
    const next = await w.store.checkout(w.scope, {
      cart_revision: cart.revision,
      cash_tendered: "50",
    });
    const recovery = await w.store.exportRecovery(w.scope);
    await w.store.importRecovery(w.scope, recovery);
    return { dirty, old, next, recovery, after: await w.store.read(w.scope) };
  });
  expect(result.dirty).toBe("CART_CHANGED");
  expect(result.old.envelope.total_amount).toBe("20.5");
  expect(result.next.envelope.total_amount).toBe("41");
  expect(result.recovery.snapshots).toHaveLength(2);
  expect(result.after.records.map((r) => r.envelope)).toEqual([
    result.old.envelope,
    result.next.envelope,
  ]);
  await context.close();
});

test("held records replay once per invocation without starving later sales and can become manager ACKs", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    for (let i = 0; i < 2; i++) {
      const current = await w.store.read(w.scope);
      const cart = await w.store.saveCart(
        w.scope,
        w.cart,
        current.cart.revision,
      );
      await w.store.checkout(w.scope, {
        cart_revision: cart.revision,
        cash_tendered: "30",
      });
    }
    const calls: number[] = [];
    const initial = await w.offline.syncOfflineSession(w.store, w.scope, {
      batchSize: 1,
      isForeground: () => true,
      fetch: async (_, init) => {
        const transaction = JSON.parse(init!.body as string).transactions[0];
        calls.push(transaction.sequence);
        return new Response(
          JSON.stringify({
            results: [
              {
                id: transaction.id,
                status:
                  transaction.sequence === 1 ? "NEEDS_REVIEW" : "ACKNOWLEDGED",
              },
            ],
          }),
        );
      },
    });
    const held = await w.store.read(w.scope);
    const reconciled = await w.offline.syncOfflineSession(w.store, w.scope, {
      isForeground: () => true,
      fetch: async (_, init) => {
        const transactions = JSON.parse(init!.body as string).transactions;
        return new Response(
          JSON.stringify({
            results: transactions.map((t: { id: string }) => ({
              id: t.id,
              status: "ACKNOWLEDGED",
            })),
          }),
        );
      },
    });
    return {
      calls,
      initial,
      held,
      reconciled,
      after: await w.store.read(w.scope),
    };
  });
  expect(result.calls).toEqual([1, 2]);
  expect(result.initial.status).toBe("COMPLETE");
  expect(result.held.records[0].status).toBe("NEEDS_REVIEW");
  expect(result.reconciled.acknowledged).toBe(1);
  expect(
    result.after.records.every((record) => record.status === "ACKNOWLEDGED"),
  ).toBe(true);
  await context.close();
});

test("unrepresentable exact amounts and exhausted sequences reject before durable checkout", async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await setup(page);
  const result = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    const refresh = structuredClone(w.prepared);
    refresh.snapshot.id = crypto.randomUUID();
    refresh.snapshot.products[0].price = "0.123456";
    await w.store.refreshSnapshot(w.scope, refresh, w.validate);
    const cart = await w.store.saveCart(
      w.scope,
      { ...w.cart, items: [{ ...w.cart.items[0], quantity: "0.123456" }] },
      1,
    );
    let precision = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: cart.revision,
        cash_tendered: "100",
      });
    } catch (e) {
      precision = (e as Error).message;
    }
    const afterPrecision = await w.store.read(w.scope);
    const recovery = await w.store.exportRecovery(w.scope);
    recovery.final_sequence = 1000000000;
    await w.store.importRecovery(w.scope, recovery);
    let sequence = "";
    try {
      await w.store.checkout(w.scope, {
        cart_revision: cart.revision,
        cash_tendered: "100",
      });
    } catch (e) {
      sequence = (e as Error).message;
    }
    return {
      precision,
      sequence,
      afterPrecision,
      after: await w.store.read(w.scope),
    };
  });
  expect(result.precision).toBe("INVALID_DATA");
  expect(result.sequence).toBe("INVALID_DATA");
  expect(result.afterPrecision.records).toEqual([]);
  expect(result.afterPrecision.next_sequence).toBe(1);
  expect(result.after.records).toEqual([]);
  expect(result.after.cart.items).toHaveLength(1);
  await context.close();
});
