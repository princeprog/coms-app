"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLocalPosStore,
  type LocalPosStore,
} from "../services/local-store";
import { syncOfflineSession } from "../services/sync-client";
import type {
  OfflineCartInput,
  OfflineLocalState,
  OfflinePrepareResponse,
  OfflineScope,
} from "../services/offline-types";
import { OfflinePosError } from "../services/offline-types";
import { scopeOf } from "../services/local-validation";
import { subscribeToLogout } from "@/features/auth/services/auth-coordination";
import {
  forgetOfflineBinding,
  readOfflineBinding,
  rememberOfflineBinding,
} from "./offline-binding";
import {
  OfflineRequestError,
  offlineBranchPath,
  offlineRequest,
  validateOfflineCashier,
  validateResumingCashier,
} from "./offline-api";
import { offlineErrorMessage } from "./offline-errors";
import { useRegisterLease } from "./use-register-lease";

export function useOfflineRegister(cashierId?: string) {
  const store = useRef<LocalPosStore | null>(null);
  const scope = useRef<OfflineScope | null>(null);
  const busy = useRef(false);
  const [state, setState] = useState<OfflineLocalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);
  const lease = useRegisterLease(state?.session.device_id);
  const read = useCallback(async () => {
    if (store.current && scope.current) {
      const next = await store.current.read(scope.current);
      setState(next);
      setLocked(false);
      return next;
    }
    return null;
  }, []);
  const lock = useCallback(async () => {
    setState(null);
    setLocked(true);
    await store.current?.lock();
  }, []);
  const sync = useCallback(async () => {
    if (!store.current || !scope.current || !navigator.onLine || busy.current)
      return;
    setSyncing(true);
    try {
      const identity = await validateOfflineCashier();
      if (identity.user_id !== scope.current.cashier_id) {
        await lock();
        return;
      }
      const result = await syncOfflineSession(store.current, scope.current);
      if (result.status === "AUTH_PAUSED") {
        setState(null);
        setLocked(true);
        return;
      }
      await read();
      if (result.status === "COMPLETE") {
        const stamp = new Date().toISOString();
        setLastSync(stamp);
        setError("");
        try {
          localStorage.setItem(
            `coms-offline-pos-sync:${scope.current.shift_id}`,
            stamp,
          );
        } catch {
          /* Display metadata is optional. */
        }
      } else if (result.status === "PARTIAL")
        setError(
          "Some sales are still waiting to sync. Keep this device's data and try again.",
        );
    } catch (failure) {
      if (
        failure instanceof OfflineRequestError &&
        [401, 403].includes(failure.status)
      )
        await lock();
      setError(offlineErrorMessage(failure));
    } finally {
      setSyncing(false);
    }
  }, [lock, read]);
  useEffect(() => {
    let disposed = false;
    let storeFailure: unknown;
    try {
      store.current = createLocalPosStore();
    } catch (failure) {
      storeFailure = failure;
    }
    scope.current = readOfflineBinding();
    const initialize = async () => {
      // Settle once so startup state is published from async work, not the effect body.
      await Promise.resolve();
      if (disposed) return;
      setOnline(navigator.onLine);
      if (storeFailure) {
        setError(offlineErrorMessage(storeFailure));
        setLoading(false);
        return;
      }
      if (scope.current) {
        try {
          setLastSync(
            localStorage.getItem(
              `coms-offline-pos-sync:${scope.current.shift_id}`,
            ),
          );
        } catch {
          /* Optional display metadata. */
        }
      }
      try {
        if (
          scope.current &&
          cashierId &&
          scope.current.cashier_id !== cashierId
        )
          await lock();
        else await read();
        if (navigator.onLine) {
          const identity = await validateOfflineCashier();
          if (disposed) return;
          setEnabled(identity.enabled);
          if (scope.current && identity.user_id !== scope.current.cashier_id)
            await lock();
          else if (scope.current) void sync();
        }
      } catch (failure) {
        if (
          failure instanceof OfflineRequestError &&
          [401, 403].includes(failure.status) &&
          scope.current
        )
          await lock();
        if (failure instanceof Error && failure.message === "LOCKED")
          setLocked(true);
        else setError(offlineErrorMessage(failure));
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void initialize();
    const onOnline = () => {
      setOnline(true);
      void sync();
    };
    const onOffline = () => setOnline(false);
    const refreshLocal = () => {
      if (!busy.current && document.visibilityState === "visible")
        void read().catch((failure) => {
          if (
            failure instanceof Error &&
            ["LOCKED", "SCOPE_MISMATCH"].includes(failure.message)
          ) {
            setState(null);
            setLocked(true);
          }
        });
    };
    const onFocus = () => {
      if (document.visibilityState === "visible") {
        refreshLocal();
        void sync();
      }
    };
    const timer = setInterval(refreshLocal, 5000);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const unsubscribe = subscribeToLogout(() => void lock());
    return () => {
      disposed = true;
      unsubscribe();
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      store.current?.close();
      store.current = null;
    };
  }, [cashierId, lock, read, sync]);
  async function operate<T>(
    operation: (store: LocalPosStore) => Promise<T>,
  ): Promise<T | undefined> {
    if (busy.current || !store.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await operation(store.current);
      await read();
      return result;
    } catch (failure) {
      setError(offlineErrorMessage(failure));
      await read().catch(() => {
        setState(null);
        setLocked(true);
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return {
    state,
    loading,
    locked,
    online,
    pending,
    syncing,
    lastSync,
    error,
    enabled,
    sync,
    lock,
    ...lease,
    clearError: () => setError(""),
    register: (branch: string, name: string) =>
      operate(async (local) =>
        offlineRequest(`${offlineBranchPath(branch)}/devices`, "POST", {
          device_id: await local.getDeviceId(),
          name,
        }),
      ),
    prepare: (branch: string) =>
      operate(async (local) => {
        // Confirm durable storage before the server reserves this cashier's shift.
        await local.preflight();
        const device_id = await local.getDeviceId();
        const prepared = await offlineRequest<OfflinePrepareResponse>(
          `${offlineBranchPath(branch)}/sessions/prepare`,
          "POST",
          { device_id },
        );
        let next: OfflineLocalState;
        try {
          next = await local.prepare(prepared, validateOfflineCashier);
        } catch (failure) {
          // A session this device could not store holds no sales. Release it so the
          // shift can still sell and close online.
          if (
            failure instanceof OfflinePosError &&
            [
              "STORAGE_NOT_PERSISTENT",
              "STORAGE_FAILED",
              "UNSUPPORTED",
            ].includes(failure.code)
          )
            await offlineRequest(
              `${offlineBranchPath(branch)}/sessions/${prepared.session.id}/finalize`,
              "POST",
              { device_id, final_sequence: 0 },
            ).catch(() => undefined);
          throw failure;
        }
        scope.current = scopeOf(next.session);
        rememberOfflineBinding(scope.current);
        setEnabled(true);
        return true;
      }),
    refreshMenu: () =>
      operate(async (local) => {
        if (!scope.current || !state || lease.readOnly) return;
        const refreshed = await offlineRequest<OfflinePrepareResponse>(
          `${offlineBranchPath(state.session.branch_id)}/sessions/${state.session.id}/refresh`,
          "POST",
          { device_id: scope.current.device_id },
        );
        await local.refreshSnapshot(
          scope.current,
          refreshed,
          validateOfflineCashier,
        );
        return true;
      }),
    unlock: () =>
      operate(async (local) => {
        if (scope.current)
          await local.unlock(scope.current, validateResumingCashier);
      }),
    saveCart: (cart: OfflineCartInput) =>
      operate(async (local) => {
        if (!lease.readOnly && scope.current && state)
          await local.saveCart(scope.current, cart, state.cart.revision);
      }),
    checkout: (amount: string) =>
      operate(async (local) => {
        if (!scope.current || !state || lease.readOnly) return;
        return local.checkout(scope.current, {
          cart_revision: state.cart.revision,
          cash_tendered: amount,
        });
      }),
    exportRecovery: () =>
      operate(async (local) => {
        if (!scope.current || lease.readOnly) return;
        await local.sealForFinalization(scope.current);
        return local.exportRecovery(scope.current);
      }),
    finalize: () =>
      operate(async (local) => {
        if (!scope.current || lease.readOnly) return;
        const current = await local.read(scope.current);
        if (
          current.cart.items.length ||
          current.records.some((record) => record.status !== "ACKNOWLEDGED")
        )
          throw new Error("Pending sales");
        const watermark = await local.sealForFinalization(scope.current);
        await offlineRequest(
          `${offlineBranchPath(current.session.branch_id)}/sessions/${current.session.id}/finalize`,
          "POST",
          watermark,
        );
        await local.lock();
        forgetOfflineBinding();
        scope.current = null;
        setState(null);
        setLocked(false);
        return true;
      }),
  };
}
export type OfflineRegister = ReturnType<typeof useOfflineRegister>;
