import { expect, test } from "vitest";
import {
  decimal,
  total,
  validateCart,
  validateEnvelope,
  validatePrepared,
} from "./local-validation";
import type { OfflineEnvelope, OfflinePrepareResponse } from "./offline-types";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const prepared: OfflinePrepareResponse = {
  session: {
    id: id(1),
    device_id: id(2),
    shift_id: id(3),
    branch_id: id(4),
    cashier_id: id(5),
    issued_at: "2026-10-26T02:00:00Z",
    server_time: "2026-10-26T02:00:00Z",
    cutoff_at: "2026-10-26T10:00:00Z",
    business_date: "2026-10-26",
  },
  snapshot: {
    id: id(6),
    branch: {
      id: id(4),
      name: "Banilad",
      supports_dine_in: true,
      supports_takeaway: true,
    },
    cash_payment_method: { id: id(7), name: "Cash" },
    products: [
      {
        id: id(8),
        name: "Chicken",
        sku: "CH",
        category_id: id(9),
        category_name: "Meals",
        price: "10.25",
        price_revision: 1,
        supports_dine_in: true,
        supports_takeaway: true,
      },
    ],
  },
};
const envelope: OfflineEnvelope = {
  id: id(10),
  session_id: id(1),
  device_id: id(2),
  shift_id: id(3),
  snapshot_id: id(6),
  sequence: 1,
  captured_at: "2026-10-26T02:00:00Z",
  service_type: "DINE_IN",
  items: [
    {
      product_id: id(8),
      quantity: "1",
      unit_price: "10.25",
      price_revision: 1,
    },
  ],
  total_amount: "10.25",
  cash_tendered: "100",
};

test("exact totals do not silently round fractional quantities to cents", () => {
  expect(total([{ ...envelope.items[0], quantity: "0.001" }])).toBe("0.01025");
});
test("wire amount precision allows 15 digits; quantities/prices stop at 12", () => {
  expect(() => decimal("999999999999999.123456", false, 15)).not.toThrow();
  expect(() => decimal("1000000000000000", false, 15)).toThrow();
  expect(() => decimal("1000000000000")).toThrow();
  expect(() => decimal("1.1234567")).toThrow();
});
test("wire bounds reject a 41-line order and a sequence above one billion", () => {
  expect(() =>
    validateCart({
      service_type: "DINE_IN",
      items: Array.from({ length: 41 }, (_, n) => ({
        product_id: id(n + 20),
        quantity: "1",
      })),
    }),
  ).toThrow();
  expect(() =>
    validateEnvelope({ ...envelope, sequence: 1000000001 }, prepared),
  ).toThrow();
  expect(() =>
    validateEnvelope(
      {
        ...envelope,
        sequence: 1000000000,
        cash_tendered: "999999999999999.123456",
      },
      prepared,
    ),
  ).not.toThrow();
});
test("unsupported catalog price is explicit and unrepresentable exact totals cannot enter the outbox", () => {
  const invalid = structuredClone(prepared);
  invalid.snapshot.products[0].price = "1000000000000";
  expect(() => validatePrepared(invalid)).toThrow("UNSUPPORTED_CATALOG");
  const precise = structuredClone(prepared);
  precise.snapshot.products[0].price = "0.123456";
  const item = {
    ...envelope.items[0],
    quantity: "0.123456",
    unit_price: "0.123456",
  };
  expect(() =>
    validateEnvelope(
      { ...envelope, items: [item], total_amount: total([item]) },
      precise,
    ),
  ).toThrow();
});
