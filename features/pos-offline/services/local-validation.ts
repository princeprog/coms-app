import {
  OfflinePosError,
  type OfflineCartInput,
  type OfflineEnvelope,
  type OfflinePrepareResponse,
  type OfflineRecovery,
  type OfflineScope,
  type OfflineSyncResponse,
  type OfflineSession,
} from "./offline-types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function ensure(
  condition: unknown,
  code: ConstructorParameters<typeof OfflinePosError>[0] = "INVALID_DATA",
): asserts condition {
  if (!condition) throw new OfflinePosError(code);
}
function object(
  value: unknown,
  keys: string[],
): asserts value is Record<string, unknown> {
  ensure(value !== null && typeof value === "object" && !Array.isArray(value));
  ensure(Object.keys(value).every((key) => keys.includes(key)));
}
function text(value: unknown) {
  ensure(typeof value === "string" && value.length > 0 && value.length <= 500);
}
export function uuid(value: unknown) {
  ensure(typeof value === "string" && uuidPattern.test(value));
}
function integer(value: unknown, min = 0) {
  ensure(Number.isSafeInteger(value) && (value as number) >= min);
}
export function decimal(
  value: unknown,
  positive = false,
  integerDigits: 12 | 15 = 12,
) {
  ensure(
    typeof value === "string" &&
      (integerDigits === 12
        ? /^\d{1,12}(?:\.\d{1,6})?$/
        : /^\d{1,15}(?:\.\d{1,6})?$/
      ).test(value),
  );
  if (positive) ensure(/[1-9]/.test(value));
}
function instant(value: unknown) {
  ensure(
    typeof value === "string" &&
      value.length <= 40 &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        value,
      ) &&
      Number.isFinite(Date.parse(value)),
  );
}
function services(value: {
  supports_dine_in?: unknown;
  supports_takeaway?: unknown;
}) {
  ensure(
    typeof value.supports_dine_in === "boolean" &&
      typeof value.supports_takeaway === "boolean",
  );
}
export function validateScope(value: OfflineScope) {
  object(value, ["cashier_id", "device_id", "branch_id", "shift_id"]);
  for (const key of [
    "cashier_id",
    "device_id",
    "branch_id",
    "shift_id",
  ] as const)
    uuid(value[key]);
}
export function scopeOf(
  value: OfflinePrepareResponse["session"],
): OfflineScope {
  return {
    cashier_id: value.cashier_id,
    device_id: value.device_id,
    branch_id: value.branch_id,
    shift_id: value.shift_id,
  };
}
export function scopeKey(value: OfflineScope) {
  validateScope(value);
  return [
    value.cashier_id,
    value.device_id,
    value.branch_id,
    value.shift_id,
  ].join(":");
}
export function sameData(left: unknown, right: unknown) {
  const canonical = (value: unknown) =>
    JSON.stringify(value, (_, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
          )
        : item,
    );
  return canonical(left) === canonical(right);
}
export function sameSession(left: OfflineSession, right: OfflineSession) {
  return sameData(
    { ...left, server_time: undefined },
    { ...right, server_time: undefined },
  );
}
export function validatePrepared(value: OfflinePrepareResponse) {
  object(value, ["session", "snapshot"]);
  const { session: s, snapshot: p } = value;
  object(s, [
    "id",
    "device_id",
    "shift_id",
    "branch_id",
    "cashier_id",
    "issued_at",
    "cutoff_at",
    "server_time",
    "business_date",
  ]);
  validateScope(scopeOf(s));
  uuid(s.id);
  instant(s.issued_at);
  instant(s.cutoff_at);
  instant(s.server_time);
  ensure(
    Date.parse(s.issued_at) <= Date.parse(s.server_time) &&
      Date.parse(s.server_time) < Date.parse(s.cutoff_at),
  );
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(s.business_date));
  object(p, ["id", "products", "cash_payment_method", "branch"]);
  uuid(p.id);
  object(p.cash_payment_method, ["id", "name"]);
  uuid(p.cash_payment_method.id);
  text(p.cash_payment_method.name);
  object(p.branch, ["id", "name", "supports_dine_in", "supports_takeaway"]);
  uuid(p.branch.id);
  text(p.branch.name);
  services(p.branch);
  ensure(p.branch.id === s.branch_id);
  ensure(Array.isArray(p.products) && p.products.length <= 20000);
  const ids = new Set<string>();
  for (const product of p.products) {
    object(product, [
      "id",
      "name",
      "sku",
      "category_id",
      "category_name",
      "price",
      "price_revision",
      "supports_dine_in",
      "supports_takeaway",
    ]);
    uuid(product.id);
    uuid(product.category_id);
    text(product.name);
    text(product.category_name);
    if (product.sku !== null) text(product.sku);
    try {
      decimal(product.price);
    } catch {
      throw new OfflinePosError("UNSUPPORTED_CATALOG");
    }
    integer(product.price_revision, 1);
    services(product);
    ensure(!ids.has(product.id));
    ids.add(product.id);
  }
}
export function validateCart(cart: OfflineCartInput) {
  object(cart, ["service_type", "items"]);
  ensure(cart.service_type === "DINE_IN" || cart.service_type === "TAKEAWAY");
  ensure(Array.isArray(cart.items) && cart.items.length <= 40);
  const ids = new Set<string>();
  for (const item of cart.items) {
    object(item, ["product_id", "quantity"]);
    uuid(item.product_id);
    decimal(item.quantity, true);
    ensure(!ids.has(item.product_id));
    ids.add(item.product_id);
  }
}
export function pricedItems(
  prepared: OfflinePrepareResponse,
  cart: OfflineCartInput,
) {
  validateCart(cart);
  const support =
    cart.service_type === "DINE_IN" ? "supports_dine_in" : "supports_takeaway";
  ensure(prepared.snapshot.branch[support]);
  return cart.items.map((item) => {
    const product = prepared.snapshot.products.find(
      (p) => p.id === item.product_id,
    );
    ensure(product && product[support]);
    return {
      ...item,
      unit_price: product.price,
      price_revision: product.price_revision,
    };
  });
}
// Exact fixed-point arithmetic: never round an offline envelope's amount.
function parts(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return { n: BigInt(whole + fraction), scale: fraction.length };
}
function power(n: number) {
  let value = BigInt(1);
  for (let i = 0; i < n; i++) value *= BigInt(10);
  return value;
}
function format(n: bigint, scale: number) {
  const raw = n.toString().padStart(scale + 1, "0");
  return scale
    ? `${raw.slice(0, -scale)}.${raw.slice(-scale)}`.replace(/\.?0+$/, "")
    : raw;
}
export function total(items: OfflineEnvelope["items"]) {
  let amount = BigInt(0),
    precision = 0;
  for (const item of items) {
    const a = parts(item.quantity),
      b = parts(item.unit_price);
    const scale = a.scale + b.scale,
      n = a.n * b.n;
    const nextPrecision = Math.max(precision, scale);
    amount =
      amount * power(nextPrecision - precision) +
      n * power(nextPrecision - scale);
    precision = nextPrecision;
  }
  return format(amount, precision);
}
export function enough(tendered: string, amount: string) {
  const a = parts(tendered),
    b = parts(amount),
    scale = Math.max(a.scale, b.scale);
  return a.n * power(scale - a.scale) >= b.n * power(scale - b.scale);
}
export function validateEnvelope(
  envelope: OfflineEnvelope,
  prepared: OfflinePrepareResponse,
) {
  object(envelope, [
    "id",
    "session_id",
    "device_id",
    "shift_id",
    "sequence",
    "snapshot_id",
    "captured_at",
    "service_type",
    "items",
    "cash_tendered",
    "total_amount",
  ]);
  uuid(envelope.id);
  integer(envelope.sequence, 1);
  ensure(envelope.sequence <= 1000000000);
  instant(envelope.captured_at);
  ensure(
    envelope.session_id === prepared.session.id &&
      envelope.device_id === prepared.session.device_id &&
      envelope.shift_id === prepared.session.shift_id &&
      envelope.snapshot_id === prepared.snapshot.id,
  );
  const captured = Date.parse(envelope.captured_at);
  ensure(
    captured >= Date.parse(prepared.session.issued_at) &&
      captured < Date.parse(prepared.session.cutoff_at),
  );
  ensure(Array.isArray(envelope.items) && envelope.items.length > 0);
  for (const item of envelope.items)
    object(item, ["product_id", "quantity", "unit_price", "price_revision"]);
  const expected = pricedItems(prepared, {
    service_type: envelope.service_type,
    items: envelope.items.map(({ product_id, quantity }) => ({
      product_id,
      quantity,
    })),
  });
  ensure(
    expected.every(
      (item, index) =>
        item.unit_price === envelope.items[index].unit_price &&
        item.price_revision === envelope.items[index].price_revision,
    ),
  );
  decimal(envelope.total_amount, false, 15);
  decimal(envelope.cash_tendered, false, 15);
  ensure(
    envelope.total_amount === total(expected) &&
      enough(envelope.cash_tendered, envelope.total_amount),
  );
}
export function validateSync(value: OfflineSyncResponse) {
  object(value, ["results"]);
  ensure(Array.isArray(value.results) && value.results.length <= 25);
  const ids = new Set<string>();
  for (const result of value.results) {
    object(result, ["id", "status", "sale_id", "sale_reference", "reason"]);
    uuid(result.id);
    ensure(!ids.has(result.id));
    ids.add(result.id);
    ensure(
      result.status === "ACKNOWLEDGED" || result.status === "NEEDS_REVIEW",
    );
    if (result.sale_id !== undefined) uuid(result.sale_id);
    if (result.sale_reference !== undefined) text(result.sale_reference);
    if (result.reason !== undefined) text(result.reason);
  }
}
export function validateRecovery(value: OfflineRecovery) {
  object(value, [
    "schema_version",
    "final_sequence",
    "scope",
    "session",
    "snapshot",
    "snapshots",
    "cart",
    "records",
  ]);
  ensure(value.schema_version === 1);
  integer(value.final_sequence);
  ensure(value.final_sequence <= 1000000000);
  ensure(Number.isSafeInteger(value.final_sequence + 1));
  validatePrepared({ session: value.session, snapshot: value.snapshot });
  ensure(
    Array.isArray(value.snapshots) &&
      value.snapshots.length > 0 &&
      value.snapshots.length <= 1000,
  );
  const snapshotIds = new Set<string>();
  for (const snapshot of value.snapshots) {
    validatePrepared({ session: value.session, snapshot });
    ensure(!snapshotIds.has(snapshot.id));
    snapshotIds.add(snapshot.id);
  }
  ensure(
    value.snapshots.some((snapshot) => sameData(snapshot, value.snapshot)),
  );
  ensure(scopeKey(value.scope) === scopeKey(scopeOf(value.session)));
  object(value.cart, ["revision", "service_type", "items"]);
  integer(value.cart.revision);
  pricedItems(value, {
    service_type: value.cart.service_type,
    items: value.cart.items,
  });
  ensure(Array.isArray(value.records) && value.records.length <= 100000);
  const ids = new Set<string>(),
    sequences = new Set<number>();
  for (const record of value.records) {
    object(record, ["envelope", "status", "result"]);
    const snapshot = value.snapshots.find(
      (snapshot) => snapshot.id === record.envelope.snapshot_id,
    );
    ensure(snapshot);
    validateEnvelope(record.envelope, { session: value.session, snapshot });
    ensure(record.envelope.sequence <= value.final_sequence);
    ensure(
      !ids.has(record.envelope.id) && !sequences.has(record.envelope.sequence),
    );
    ids.add(record.envelope.id);
    sequences.add(record.envelope.sequence);
    ensure(["PENDING", "ACKNOWLEDGED", "NEEDS_REVIEW"].includes(record.status));
    if (record.result) {
      validateSync({ results: [record.result] });
      ensure(
        record.result.id === record.envelope.id &&
          record.result.status === record.status,
      );
    }
  }
}
