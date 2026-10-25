import { z } from "zod";
import type { OfflineScope } from "../services/offline-types";

// Locator only; it grants no access. IndexedDB's locked cashier binding remains authoritative.
const key = "coms-offline-pos-scope-v1";
const schema = z
  .object({
    cashier_id: z.uuid(),
    device_id: z.uuid(),
    branch_id: z.uuid(),
    shift_id: z.uuid(),
  })
  .strict();
export function readOfflineBinding(): OfflineScope | null {
  try {
    const parsed = schema.safeParse(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export function rememberOfflineBinding(scope: OfflineScope) {
  localStorage.setItem(key, JSON.stringify(schema.parse(scope)));
}
export function forgetOfflineBinding() {
  localStorage.removeItem(key);
}
