import {
  OfflinePosError,
  type OfflineScope,
  type OfflineSyncResponse,
} from "./offline-types";
import type { LocalPosStore } from "./local-store";
import { ensure, validateSync } from "./local-validation";

export interface OfflineSyncOptions {
  fetch?: typeof globalThis.fetch;
  batchSize?: number;
  maxBatches?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  requestTimeoutMs?: number;
  signal?: AbortSignal;
  isForeground?: () => boolean;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}
export interface OfflineSyncOutcome {
  status: "COMPLETE" | "PARTIAL" | "PAUSED" | "AUTH_PAUSED" | "BUSY";
  acknowledged: number;
  needs_review: number;
}
function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/** Call on startup, focus, online or explicit retry; no service-worker/background dependency.
 * The BFF must revalidate the session's cashier/device/branch/shift on every request.
 */
export async function syncOfflineSession(
  store: LocalPosStore,
  scope: OfflineScope,
  options: OfflineSyncOptions = {},
): Promise<OfflineSyncOutcome> {
  const request = options.fetch ?? globalThis.fetch;
  const batchSize = options.batchSize ?? 25,
    maxBatches = options.maxBatches ?? 10,
    maxAttempts = options.maxAttempts ?? 4;
  ensure(Number.isInteger(batchSize) && batchSize >= 1 && batchSize <= 25);
  ensure(Number.isInteger(maxBatches) && maxBatches >= 1 && maxBatches <= 100);
  ensure(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 6);
  const baseDelay = options.baseDelayMs ?? 500;
  ensure(Number.isFinite(baseDelay) && baseDelay >= 0 && baseDelay <= 30000);
  const timeoutMs = options.requestTimeoutMs ?? 15000;
  ensure(Number.isFinite(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 60000);
  const sleep = options.sleep ?? delay;
  const active = () =>
    !options.signal?.aborted &&
    (options.isForeground?.() ??
      (typeof document === "undefined" ||
        document.visibilityState === "visible"));
  const outcome: OfflineSyncOutcome = {
    status: "PARTIAL",
    acknowledged: 0,
    needs_review: 0,
  };
  try {
    return await store.withSyncLock(scope, async () => {
      const attemptedIds: string[] = [];
      for (let batchIndex = 0; batchIndex < maxBatches; batchIndex++) {
        if (!active()) return { ...outcome, status: "PAUSED" };
        const batch = await store.pendingBatch(scope, batchSize, attemptedIds);
        if (!batch.transactions.length)
          return { ...outcome, status: "COMPLETE" };
        const path = `/api/pos-offline/branches/${encodeURIComponent(scope.branch_id)}/sessions/${encodeURIComponent(batch.session_id)}/sync`;
        // Keep this exact serialized payload/UUID across lost-response retries.
        const body = JSON.stringify({
          device_id: scope.device_id,
          transactions: batch.transactions,
        });
        let results: OfflineSyncResponse | undefined;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (!active()) return { ...outcome, status: "PAUSED" };
          // Logout/account changes in another tab must stop subsequent network attempts.
          const current = await store.pendingBatch(scope, batchSize);
          if (current.epoch !== batch.epoch)
            return { ...outcome, status: "AUTH_PAUSED" };
          const controller = new AbortController();
          const abort = () => controller.abort(options.signal?.reason);
          options.signal?.addEventListener("abort", abort, { once: true });
          const timer = setTimeout(
            () =>
              controller.abort(
                new DOMException("Sync request timed out", "TimeoutError"),
              ),
            timeoutMs,
          );
          try {
            const response = await request(path, {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              redirect: "error",
              headers: { "Content-Type": "application/json" },
              body,
              signal: controller.signal,
            });
            if (response.status === 401 || response.status === 403) {
              await store.lock();
              return { ...outcome, status: "AUTH_PAUSED" };
            }
            if (response.ok) {
              results = (await response.json()) as OfflineSyncResponse;
              validateSync(results);
              break;
            }
            if (
              response.status !== 408 &&
              response.status !== 429 &&
              response.status < 500
            )
              return outcome;
          } catch (error) {
            if (error instanceof OfflinePosError) throw error;
            if (options.signal?.aborted)
              return { ...outcome, status: "PAUSED" };
          } finally {
            clearTimeout(timer);
            options.signal?.removeEventListener("abort", abort);
          }
          if (attempt + 1 < maxAttempts)
            await sleep(
              Math.min(30000, baseDelay * 2 ** attempt),
              options.signal,
            );
        }
        if (!results) return outcome;
        await store.acknowledge(
          scope,
          results,
          batch.transactions.map((t) => t.id),
          batch.epoch,
        );
        attemptedIds.push(
          ...batch.transactions.map((transaction) => transaction.id),
        );
        outcome.acknowledged += results.results.filter(
          (r) => r.status === "ACKNOWLEDGED",
        ).length;
        outcome.needs_review += results.results.filter(
          (r) => r.status === "NEEDS_REVIEW",
        ).length;
        // Missing acknowledgements stay queued; don't spin on a partial/malformed server batch.
        if (results.results.length < batch.transactions.length) return outcome;
      }
      return (await store.pendingBatch(scope, 1, attemptedIds)).transactions
        .length
        ? outcome
        : { ...outcome, status: "COMPLETE" };
    });
  } catch (error) {
    if (options.signal?.aborted) return { ...outcome, status: "PAUSED" };
    if (error instanceof OfflinePosError && error.code === "BUSY")
      return { ...outcome, status: "BUSY" };
    if (
      error instanceof OfflinePosError &&
      (error.code === "LOCKED" || error.code === "SCOPE_MISMATCH")
    )
      return { ...outcome, status: "AUTH_PAUSED" };
    throw error;
  }
}
