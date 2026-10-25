import {
  createLocalDatabase,
  exclusive,
  requireWebLocks,
  type LocalTransaction,
} from "./local-database";
import {
  OfflinePosError,
  type OfflineCartInput,
  type OfflineLocalState,
  type OfflinePrepareResponse,
  type OfflineRecord,
  type OfflineRecovery,
  type OfflineScope,
  type OfflineSyncResponse,
  type OnlineCashierValidator,
} from "./offline-types";
import {
  decimal,
  enough,
  ensure,
  pricedItems,
  scopeKey,
  scopeOf,
  total,
  sameData,
  sameSession,
  validateEnvelope,
  validatePrepared,
  validateRecovery,
  validateSync,
} from "./local-validation";

export interface LocalPosStoreOptions {
  databaseName?: string;
  indexedDB?: IDBFactory;
  locks?: LockManager;
  storage?: Pick<StorageManager, "persist" | "persisted">;
  now?: () => number;
  monotonicNow?: () => number;
}

/** No network side effects, tokens, localStorage, deletion, or UI state. */
export function createLocalPosStore(options: LocalPosStoreOptions = {}) {
  const name = options.databaseName ?? "coms-pos-offline-v1";
  const factory = options.indexedDB ?? globalThis.indexedDB;
  ensure(factory, "UNSUPPORTED");
  const locks = requireWebLocks(options.locks ?? globalThis.navigator?.locks);
  const storage = options.storage ?? globalThis.navigator?.storage;
  const now = options.now ?? Date.now;
  const monotonic = options.monotonicNow ?? (() => performance.now());
  const anchor = { wall: now(), monotonic: monotonic() };
  const db = createLocalDatabase(name, factory);
  const writer = <T>(task: () => Promise<T>, wait = false) =>
    exclusive(locks, `${name}:writer`, task, wait);
  let locallyLocked = false;

  async function requirePersistence() {
    ensure(
      typeof storage?.persist === "function" &&
        typeof storage?.persisted === "function",
      "STORAGE_NOT_PERSISTENT",
    );
    const granted = (await storage.persisted()) || (await storage.persist());
    ensure(granted && (await storage.persisted()), "STORAGE_NOT_PERSISTENT");
    await db.verifyReadWrite();
  }
  function access(data: LocalTransaction, scope: OfflineScope) {
    ensure(!locallyLocked && data.metadata && !data.metadata.locked, "LOCKED");
    ensure(
      data.metadata.cashier_id === scope.cashier_id &&
        data.metadata.device_id === scope.device_id,
      "SCOPE_MISMATCH",
    );
    ensure(data.state, "NOT_PREPARED");
    ensure(
      scopeKey(scopeOf(data.state.session)) === scopeKey(scope),
      "SCOPE_MISMATCH",
    );
    return data.state;
  }
  function tick(state: OfflineLocalState) {
    const wall = now(),
      clock = state.clock;
    if (
      wall < clock.last_wall_ms - 2000 ||
      wall < anchor.wall + monotonic() - anchor.monotonic - 2000
    )
      clock.rollback_detected = true;
    clock.last_wall_ms = Math.max(clock.last_wall_ms, wall);
    const server = Math.max(clock.last_server_ms, wall + clock.offset_ms);
    clock.last_server_ms = server;
    if (clock.rollback_detected) return new OfflinePosError("CLOCK_ROLLBACK");
    if (server >= Date.parse(state.session.cutoff_at))
      return new OfflinePosError("CUTOFF");
  }
  async function mutate<T>(
    scope: OfflineScope,
    operation: (state: OfflineLocalState, data: LocalTransaction) => T,
    selling = false,
  ) {
    const outcome = await writer(() =>
      db.transact(scopeKey(scope), (data) => {
        const state = access(data, scope),
          error = tick(state);
        if (selling && state.selling_enabled === false)
          return { error: new OfflinePosError("OFFLINE_DISABLED") };
        if (selling && state.sealed)
          return { error: new OfflinePosError("SESSION_SEALED") };
        // Persist a detected rollback even when rejecting the sale.
        if (selling && error) return { error };
        return { value: operation(state, data) };
      }),
    );
    if (outcome.error) throw outcome.error;
    return structuredClone(outcome.value as T);
  }
  async function validated(
    scope: OfflineScope,
    validate: OnlineCashierValidator,
    requireEnabled = false,
  ) {
    scopeKey(scope);
    const epoch = await writer(() =>
      db.transact(undefined, (data) => data.metadata?.epoch),
    );
    try {
      const identity = await validate();
      ensure(
        identity.user_id === scope.cashier_id &&
          typeof identity.enabled === "boolean",
        "SCOPE_MISMATCH",
      );
      if (requireEnabled) ensure(identity.enabled, "OFFLINE_DISABLED");
      return { epoch, enabled: identity.enabled };
    } catch (error) {
      await api.lock();
      throw error;
    }
  }
  function grant(
    data: LocalTransaction,
    scope: OfflineScope,
    epoch: number | undefined,
  ) {
    ensure(
      data.metadata && data.metadata.device_id === scope.device_id,
      "SCOPE_MISMATCH",
    );
    ensure(data.metadata.epoch === epoch, "LOCKED");
    data.metadata.cashier_id = scope.cashier_id;
    data.metadata.locked = false;
    data.metadata.epoch += 1;
  }
  const api = {
    /** Call BEFORE the server prepare request reserves the cashier's shift. */
    preflight() {
      return writer(requirePersistence);
    },
    async getDeviceId() {
      return writer(() =>
        db.transact(undefined, (data) => {
          data.metadata ??= {
            device_id: crypto.randomUUID(),
            cashier_id: null,
            locked: true,
            epoch: 0,
          };
          return data.metadata.device_id;
        }),
      );
    },
    async prepare(
      input: OfflinePrepareResponse,
      validate: OnlineCashierValidator,
    ) {
      const prepared = structuredClone(input);
      validatePrepared(prepared);
      const scope = scopeOf(prepared.session),
        validation = await validated(scope, validate, true);
      await writer(async () => {
        await requirePersistence();
        await db.transact(scopeKey(scope), (data) => {
          grant(data, scope, validation.epoch);
          if (data.state) {
            // A prepared shift is immutable, including its expiry and price snapshot.
            ensure(
              sameSession(data.state.session, prepared.session) &&
                sameData(data.state.snapshot, prepared.snapshot),
              "CONFLICT",
            );
            data.state.selling_enabled = true;
            return;
          }
          const wall = now(),
            server = Date.parse(prepared.session.server_time);
          data.state = {
            ...prepared,
            snapshots: [prepared.snapshot],
            selling_enabled: true,
            cart: {
              revision: 0,
              service_type: prepared.snapshot.branch.supports_dine_in
                ? "DINE_IN"
                : "TAKEAWAY",
              items: [],
            },
            records: [],
            next_sequence: 1,
            sealed: false,
            clock: {
              offset_ms: server - wall,
              last_wall_ms: wall,
              last_server_ms: server,
              rollback_detected: false,
            },
          };
        });
      });
      locallyLocked = false;
      return api.read(scope);
    },
    async unlock(scope: OfflineScope, validate: OnlineCashierValidator) {
      const validation = await validated(scope, validate);
      await writer(() =>
        db.transact(scopeKey(scope), (data) => {
          ensure(
            data.state &&
              scopeKey(scopeOf(data.state.session)) === scopeKey(scope),
            "NOT_PREPARED",
          );
          grant(data, scope, validation.epoch);
          data.state.selling_enabled = validation.enabled;
        }),
      );
      locallyLocked = false;
      return api.read(scope);
    },
    async refreshSnapshot(
      scope: OfflineScope,
      input: OfflinePrepareResponse,
      validate: OnlineCashierValidator,
    ) {
      const prepared = structuredClone(input);
      validatePrepared(prepared);
      ensure(
        scopeKey(scopeOf(prepared.session)) === scopeKey(scope),
        "SCOPE_MISMATCH",
      );
      const validation = await validated(scope, validate, true);
      await mutate(scope, (state, data) => {
        ensure(data.metadata!.epoch === validation.epoch, "LOCKED");
        ensure(!state.sealed, "SESSION_SEALED");
        ensure(state.cart.items.length === 0, "CART_CHANGED");
        ensure(sameSession(state.session, prepared.session), "CONFLICT");
        state.snapshots ??= [state.snapshot];
        const existing = state.snapshots.find(
          (s) => s.id === prepared.snapshot.id,
        );
        if (existing) ensure(sameData(existing, prepared.snapshot), "CONFLICT");
        else {
          ensure(state.snapshots.length < 1000);
          state.snapshots.push(prepared.snapshot);
        }
        state.snapshot = prepared.snapshot;
        state.selling_enabled = true;
        const support =
          state.cart.service_type === "DINE_IN"
            ? "supports_dine_in"
            : "supports_takeaway";
        if (!state.snapshot.branch[support])
          state.cart.service_type = state.snapshot.branch.supports_dine_in
            ? "DINE_IN"
            : "TAKEAWAY";
        state.cart.revision += 1;
      });
      return api.read(scope);
    },
    async lock() {
      locallyLocked = true;
      await writer(
        () =>
          db.transact(undefined, (data) => {
            if (data.metadata) {
              data.metadata.locked = true;
              data.metadata.cashier_id = null;
              data.metadata.epoch += 1;
            }
          }),
        true,
      );
    },
    read(scope: OfflineScope) {
      return mutate(scope, (state) => state);
    },
    sealForFinalization(scope: OfflineScope) {
      return mutate(scope, (state) => {
        ensure(state.cart.items.length === 0, "CART_CHANGED");
        state.sealed = true;
        return {
          device_id: scope.device_id,
          final_sequence: state.next_sequence - 1,
        };
      });
    },
    saveCart(
      scope: OfflineScope,
      input: OfflineCartInput,
      expectedRevision: number,
    ) {
      const cart = structuredClone(input);
      return mutate(
        scope,
        (state) => {
          ensure(state.cart.revision === expectedRevision, "CART_CHANGED");
          pricedItems(state, cart);
          state.cart = { ...cart, revision: state.cart.revision + 1 };
          return state.cart;
        },
        true,
      );
    },
    checkout(
      scope: OfflineScope,
      input: { cart_revision: number; cash_tendered: string },
    ) {
      const tendered = input.cash_tendered,
        revision = input.cart_revision;
      decimal(tendered, false, 15);
      return mutate(
        scope,
        (state) => {
          ensure(state.cart.revision === revision, "CART_CHANGED");
          ensure(state.cart.items.length > 0);
          const items = pricedItems(state, {
            service_type: state.cart.service_type,
            items: state.cart.items,
          });
          const amount = total(items);
          ensure(enough(tendered, amount));
          ensure(
            Number.isSafeInteger(state.next_sequence) &&
              state.next_sequence >= 1 &&
              state.next_sequence <= 1000000000,
          );
          const record: OfflineRecord = {
            status: "PENDING",
            envelope: {
              id: crypto.randomUUID(),
              session_id: state.session.id,
              device_id: scope.device_id,
              shift_id: scope.shift_id,
              sequence: state.next_sequence,
              snapshot_id: state.snapshot.id,
              captured_at: new Date(state.clock.last_server_ms).toISOString(),
              service_type: state.cart.service_type,
              items,
              cash_tendered: tendered,
              total_amount: amount,
            },
          };
          validateEnvelope(record.envelope, state);
          state.records.push(record);
          state.next_sequence += 1;
          state.cart = {
            ...state.cart,
            items: [],
            revision: state.cart.revision + 1,
          };
          return record;
        },
        true,
      );
    },
    exportRecovery(scope: OfflineScope): Promise<OfflineRecovery> {
      return mutate(scope, (state) => ({
        schema_version: 1 as const,
        final_sequence: state.next_sequence - 1,
        scope: scopeOf(state.session),
        session: state.session,
        snapshot: state.snapshot,
        snapshots: state.snapshots ?? [state.snapshot],
        cart: state.cart,
        records: state.records,
      }));
    },
    importRecovery(scope: OfflineScope, input: unknown) {
      const recovery = structuredClone(input) as OfflineRecovery;
      validateRecovery(recovery);
      ensure(scopeKey(recovery.scope) === scopeKey(scope), "SCOPE_MISMATCH");
      return mutate(scope, (state) => {
        ensure(
          !state.sealed || recovery.final_sequence < state.next_sequence,
          "SESSION_SEALED",
        );
        ensure(sameSession(state.session, recovery.session), "CONFLICT");
        state.snapshots ??= [state.snapshot];
        for (const snapshot of recovery.snapshots) {
          const existing = state.snapshots.find((s) => s.id === snapshot.id);
          if (existing) ensure(sameData(existing, snapshot), "CONFLICT");
          else {
            ensure(state.snapshots.length < 1000);
            state.snapshots.push(snapshot);
          }
        }
        let added = 0;
        for (const record of recovery.records) {
          const existing = state.records.find(
            (r) => r.envelope.id === record.envelope.id,
          );
          if (existing) {
            ensure(sameData(existing.envelope, record.envelope), "CONFLICT");
            continue;
          }
          ensure(!state.sealed, "SESSION_SEALED");
          ensure(
            !state.records.some(
              (r) => r.envelope.sequence === record.envelope.sequence,
            ),
            "CONFLICT",
          );
          // An imported ACK is not server evidence. Replay unchanged envelopes for authoritative ACK.
          state.records.push({
            envelope: record.envelope,
            status:
              record.status === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING",
          });
          state.next_sequence = Math.max(
            state.next_sequence,
            record.envelope.sequence + 1,
          );
          state.clock.last_server_ms = Math.max(
            state.clock.last_server_ms,
            Date.parse(record.envelope.captured_at),
          );
          added += 1;
        }
        ensure(Number.isSafeInteger(state.next_sequence));
        state.next_sequence = Math.max(
          state.next_sequence,
          recovery.final_sequence + 1,
        );
        ensure(Number.isSafeInteger(state.next_sequence));
        state.records.sort((a, b) => a.envelope.sequence - b.envelope.sequence);
        // Never replace a newer local draft or resurrect a cart already captured as a sale.
        if (state.cart.revision === 0 && recovery.cart.revision > 0) {
          ensure(sameData(state.snapshot, recovery.snapshot), "CONFLICT");
          state.cart = recovery.cart;
        }
        return { added };
      });
    },
    /** Sync-only: epoch binds a response to the account active when it was sent. */
    pendingBatch(
      scope: OfflineScope,
      limit: number,
      excludeIds: readonly string[] = [],
    ) {
      ensure(Number.isSafeInteger(limit) && limit >= 1 && limit <= 25);
      return mutate(scope, (state, data) => ({
        session_id: state.session.id,
        epoch: data.metadata!.epoch,
        transactions: state.records
          .filter(
            (r) =>
              r.status !== "ACKNOWLEDGED" &&
              !excludeIds.includes(r.envelope.id),
          )
          .sort((a, b) => a.envelope.sequence - b.envelope.sequence)
          .slice(0, limit)
          .map((r) => r.envelope),
      }));
    },
    acknowledge(
      scope: OfflineScope,
      response: OfflineSyncResponse,
      sentIds: string[],
      epoch: number,
    ) {
      const results = structuredClone(response);
      validateSync(results);
      results.results.forEach((result) => ensure(sentIds.includes(result.id)));
      return mutate(scope, (state, data) => {
        ensure(data.metadata!.epoch === epoch, "LOCKED");
        for (const result of results.results) {
          const record = state.records.find((r) => r.envelope.id === result.id);
          ensure(record);
          if (record.status === "ACKNOWLEDGED") continue;
          if (
            record.status === "NEEDS_REVIEW" &&
            result.status !== "ACKNOWLEDGED"
          )
            continue;
          record.status = result.status;
          record.result = result;
        }
      });
    },
    withSyncLock<T>(scope: OfflineScope, task: () => Promise<T>) {
      return exclusive(locks, `${name}:sync:${scopeKey(scope)}`, task);
    },
    close() {
      db.close();
    },
  };
  return api;
}
export type LocalPosStore = ReturnType<typeof createLocalPosStore>;
