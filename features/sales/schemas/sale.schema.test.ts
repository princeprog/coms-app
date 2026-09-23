import { describe, expect, it } from "vitest";
import {
  createSaleSchema,
  saleDetailSchema,
  salePageSchema,
} from "./sale.schema";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";

const sale = {
  id,
  branch_id: id,
  cashier_user_id: id,
  status: "COMPLETED",
  tender_method: "cash",
  total_amount: "12.5000",
  idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  created_at: timestamp,
};

describe("sale schemas", () => {
  it("accepts API decimal strings and sale history/detail snapshots", () => {
    expect(
      salePageSchema.parse({
        items: [{ ...sale, cashier_name: "Cashier" }],
        total: 1,
        page: 1,
        page_size: 25,
      }).items[0]?.total_amount,
    ).toBe("12.5000");
    expect(
      saleDetailSchema.parse({
        ...sale,
        items: [
          {
            id: productId,
            product_id: productId,
            product_name_snapshot: "Chicken sandwich",
            quantity: "0.5000",
            unit_price: "25.0000",
            line_total: "12.5000",
            created_at: timestamp,
          },
        ],
        events: [
          {
            id: productId,
            event_type: "COMPLETED",
            actor_user_id: id,
            reason: null,
            created_at: timestamp,
          },
        ],
      }).items[0]?.line_total,
    ).toBe("12.5000");
  });

  it("rejects numeric money, zero quantities, duplicate products, and unknown sale fields", () => {
    expect(
      salePageSchema.safeParse({
        items: [{ ...sale, total_amount: 12.5, cashier_name: "Cashier" }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
    expect(
      createSaleSchema.safeParse({
        tender_method: "cash",
        items: [{ product_id: productId, quantity: "0" }],
      }).success,
    ).toBe(false);
    expect(
      createSaleSchema.safeParse({
        tender_method: "cash",
        items: [
          { product_id: productId, quantity: "1" },
          { product_id: productId, quantity: "2" },
        ],
      }).success,
    ).toBe(false);
    expect(
      createSaleSchema.safeParse({
        tender_method: "cash",
        total_amount: "0.01",
        items: [{ product_id: productId, quantity: "1" }],
      }).success,
    ).toBe(false);
  });
});
