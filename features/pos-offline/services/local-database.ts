import { OfflinePosError, type OfflineLocalState } from "./offline-types";

export interface LocalMetadata {
  device_id: string;
  cashier_id: string | null;
  locked: boolean;
  epoch: number;
}
export interface LocalTransaction {
  metadata?: LocalMetadata;
  state?: OfflineLocalState;
}

/** Only synchronous work is allowed inside mutate: IDB must not auto-commit between awaits. */
export function createLocalDatabase(name: string, factory: IDBFactory) {
  let connection: Promise<IDBDatabase> | undefined;
  function open() {
    if (!connection)
      connection = new Promise<IDBDatabase>((resolve, reject) => {
        const request = factory.open(name, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("data");
        };
        request.onerror = () => {
          connection = undefined;
          reject(new OfflinePosError("STORAGE_FAILED"));
        };
        request.onblocked = () => {
          connection = undefined;
          reject(new OfflinePosError("STORAGE_FAILED"));
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            connection = undefined;
          };
          resolve(db);
        };
      });
    return connection;
  }
  async function transact<T>(
    key: string | undefined,
    mutate: (data: LocalTransaction) => T,
  ): Promise<T> {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      let result: T;
      let thrown: unknown;
      let transaction: IDBTransaction;
      try {
        transaction = db.transaction("data", "readwrite", {
          durability: "strict",
        });
      } catch {
        reject(new OfflinePosError("STORAGE_FAILED"));
        return;
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () =>
        reject(thrown ?? new OfflinePosError("STORAGE_FAILED"));
      transaction.onerror = () => {
        /* onabort is the completion boundary */
      };
      const store = transaction.objectStore("data");
      const meta = store.get("metadata");
      const state = key ? store.get(`scope:${key}`) : undefined;
      let finished = false;
      const finish = () => {
        if (
          finished ||
          meta.readyState !== "done" ||
          (state && state.readyState !== "done")
        )
          return;
        finished = true;
        try {
          const data: LocalTransaction = {
            metadata: meta.result,
            state: state?.result,
          };
          result = mutate(data);
          if (data.metadata) store.put(data.metadata, "metadata");
          if (key && data.state) store.put(data.state, `scope:${key}`);
        } catch (error) {
          thrown = error;
          transaction.abort();
        }
      };
      meta.onsuccess = finish;
      if (state) state.onsuccess = finish;
    });
  }
  async function verifyReadWrite() {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("data", "readwrite", { durability: "strict" });
      const store = tx.objectStore("data"),
        value = crypto.randomUUID();
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(new OfflinePosError("STORAGE_FAILED"));
      store.put(value, "probe");
      const read = store.get("probe");
      read.onsuccess = () => {
        if (read.result !== value) tx.abort();
        else store.delete("probe");
      };
    });
  }
  return {
    transact,
    verifyReadWrite,
    close() {
      void connection?.then(
        (db) => db.close(),
        () => {},
      );
      connection = undefined;
    },
  };
}

export function requireWebLocks(locks: LockManager | undefined): LockManager {
  if (!locks?.request) throw new OfflinePosError("UNSUPPORTED");
  return locks;
}
export async function exclusive<T>(
  locks: LockManager,
  name: string,
  task: () => Promise<T>,
  wait = false,
): Promise<T> {
  return await locks.request(
    name,
    { mode: "exclusive", ifAvailable: !wait },
    (lock) => {
      if (!lock) throw new OfflinePosError("BUSY");
      return task();
    },
  );
}
