import type { OfflineLocalState } from "./offline-types";

const DATABASE = "coms-pos-offline-v1";

/** An app update is safe only when no saved order or unconfirmed sale remains. */
export function offlineDataAllowsUpdate(states: OfflineLocalState[]) {
  return states.every(
    (state) =>
      state.cart.items.length === 0 &&
      state.records.every((record) => record.status === "ACKNOWLEDGED"),
  );
}

/** Read-only scan of every prepared register, including locked ones. Never creates the database. */
export async function readSavedRegisters(
  factory: IDBFactory | undefined = globalThis.indexedDB,
): Promise<OfflineLocalState[]> {
  if (!factory) return [];
  if (typeof factory.databases === "function") {
    const existing = await factory.databases();
    if (!existing.some((database) => database.name === DATABASE)) return [];
  }
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(DATABASE);
    request.onupgradeneeded = () => {
      // Opening created an empty database; abort so nothing is left behind.
      request.transaction?.abort();
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("blocked"));
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError")
      return null;
    throw error;
  });
  if (!db) return [];
  try {
    if (!db.objectStoreNames.contains("data")) return [];
    return await new Promise<OfflineLocalState[]>((resolve, reject) => {
      const transaction = db.transaction("data", "readonly");
      const range = IDBKeyRange.bound("scope:", "scope:\uffff");
      const request = transaction.objectStore("data").getAll(range);
      request.onsuccess = () => resolve(request.result as OfflineLocalState[]);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function savedRegistersAllowUpdate() {
  try {
    return offlineDataAllowsUpdate(await readSavedRegisters());
  } catch {
    return false;
  }
}
