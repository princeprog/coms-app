/** Data only. Device association is never proof of authentication. */
export interface OfflineScope {
  cashier_id: string;
  device_id: string;
  branch_id: string;
  shift_id: string;
}
export interface OfflineSession extends OfflineScope {
  id: string;
  issued_at: string;
  cutoff_at: string;
  server_time: string;
  business_date: string;
}
export interface OfflineSnapshot {
  id: string;
  products: {
    id: string;
    name: string;
    sku: string | null;
    category_id: string;
    category_name: string;
    price: string;
    price_revision: number;
    supports_dine_in: boolean;
    supports_takeaway: boolean;
  }[];
  cash_payment_method: { id: string; name: string };
  branch: {
    id: string;
    name: string;
    supports_dine_in: boolean;
    supports_takeaway: boolean;
  };
}
export interface OfflinePrepareResponse {
  session: OfflineSession;
  snapshot: OfflineSnapshot;
}
export type OfflineServiceType = "DINE_IN" | "TAKEAWAY";
export interface OfflineCartInput {
  service_type: OfflineServiceType;
  items: { product_id: string; quantity: string }[];
}
export interface OfflineCart extends OfflineCartInput {
  revision: number;
}
export interface OfflineEnvelope {
  id: string;
  session_id: string;
  device_id: string;
  shift_id: string;
  sequence: number;
  snapshot_id: string;
  captured_at: string;
  service_type: OfflineServiceType;
  items: {
    product_id: string;
    quantity: string;
    unit_price: string;
    price_revision: number;
  }[];
  cash_tendered: string;
  total_amount: string;
}
export interface OfflineSyncResult {
  id: string;
  status: "ACKNOWLEDGED" | "NEEDS_REVIEW";
  sale_id?: string;
  sale_reference?: string;
  reason?: string;
}
export interface OfflineSyncResponse {
  results: OfflineSyncResult[];
}
export interface OfflineRecord {
  envelope: OfflineEnvelope;
  status: "PENDING" | "ACKNOWLEDGED" | "NEEDS_REVIEW";
  result?: OfflineSyncResult;
}
export interface OfflineLocalState extends OfflinePrepareResponse {
  snapshots: OfflineSnapshot[];
  selling_enabled: boolean;
  cart: OfflineCart;
  records: OfflineRecord[];
  next_sequence: number;
  sealed: boolean;
  clock: {
    offset_ms: number;
    last_wall_ms: number;
    last_server_ms: number;
    rollback_detected: boolean;
  };
}
export interface OfflineRecovery extends OfflinePrepareResponse {
  snapshots: OfflineSnapshot[];
  schema_version: 1;
  final_sequence: number;
  scope: OfflineScope;
  cart: OfflineCart;
  records: OfflineRecord[];
}
/** Must call an authenticated, no-store BFF and reject when offline/unauthorized.
 * The parent owns authentication; do not implement this from a cached user or device ID.
 */
export type OnlineCashierValidator = () => Promise<{
  user_id: string;
  enabled: boolean;
}>;
export type OfflineErrorCode =
  | "UNSUPPORTED"
  | "STORAGE_NOT_PERSISTENT"
  | "STORAGE_FAILED"
  | "BUSY"
  | "LOCKED"
  | "SCOPE_MISMATCH"
  | "NOT_PREPARED"
  | "INVALID_DATA"
  | "CART_CHANGED"
  | "CUTOFF"
  | "CLOCK_ROLLBACK"
  | "CONFLICT"
  | "SESSION_SEALED"
  | "UNSUPPORTED_CATALOG"
  | "OFFLINE_DISABLED";
export class OfflinePosError extends Error {
  constructor(public readonly code: OfflineErrorCode) {
    super(code);
    this.name = "OfflinePosError";
  }
}
