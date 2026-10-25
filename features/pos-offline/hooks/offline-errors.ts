import { OfflinePosError } from "../services/offline-types";
import { OfflineRequestError } from "./offline-api";
const messages = {
  UNSUPPORTED:
    "This browser cannot securely store offline sales. Use a supported browser online.",
  STORAGE_NOT_PERSISTENT:
    "Allow persistent browser storage before preparing offline sales. Do not use private browsing.",
  STORAGE_FAILED:
    "The sale could not be saved on this device. Keep the order and try again after freeing storage.",
  BUSY: "This register is busy in another tab. Wait a moment and try again.",
  LOCKED:
    "This register is locked. Connect and sign in as its cashier to unlock it.",
  SCOPE_MISMATCH:
    "This register belongs to another cashier or shift. Sign in as the original cashier.",
  NOT_PREPARED: "Prepare this register online before taking offline sales.",
  INVALID_DATA:
    "Check the order, service and cash amount. The order has not been completed.",
  CART_CHANGED:
    "The order changed in another tab. Review the latest order before completing it.",
  CUTOFF:
    "The business day has ended. Sync and finalize this register online before closing the shift.",
  CLOCK_ROLLBACK:
    "The device clock changed. Selling is paused; connect to COMS for assistance. Saved sales are retained.",
  CONFLICT:
    "This device has a different prepared session. Keep its saved sales and ask a manager for help.",
  SESSION_SEALED:
    "This register has stopped selling for finalization or recovery. Sync and finalize its saved sales.",
  UNSUPPORTED_CATALOG:
    "This menu has prices this register cannot store offline. Ask an administrator to review product prices.",
  OFFLINE_DISABLED:
    "Offline checkout is turned off. Sync and finalize saved sales, then use the online register.",
};
export function offlineErrorMessage(error: unknown) {
  if (error instanceof OfflinePosError) return messages[error.code];
  if (error instanceof OfflineRequestError) return error.message;
  return "COMS could not complete this operation. Your saved sales remain on this device. Try again.";
}
