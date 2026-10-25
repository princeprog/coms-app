import { readOfflineBinding } from "./offline-binding";
import { createLocalPosStore } from "../services/local-store";

/** Lock before account transitions, including when the POS itself is not mounted. */
export async function lockOfflineRegister() {
  if (typeof window === "undefined" || !readOfflineBinding()) return;
  const store = createLocalPosStore();
  try {
    await store.lock();
  } finally {
    store.close();
  }
}
