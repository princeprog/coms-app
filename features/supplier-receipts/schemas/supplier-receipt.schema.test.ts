import { describe, expect, it } from "vitest";
import {
  createSupplierReceiptSchema,
  supplierReceiptDetailSchema,
  supplierReceiptPageSchema,
} from "./supplier-receipt.schema";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

const receipt = {
  id,
  supplier_id: id,
  supplier_name: "North Farm Supply",
  received_at: "2026-09-24",
  status: "DRAFT" as const,
  idempotency_key: id,
  created_by_user_id: id,
  posted_by_user_id: null,
  posted_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  total_cost: "33.6250",
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_received: "2.5000",
      unit_cost: "13.250",
      line_total: "33.125000",
    },
  ],
};

describe("supplier receipt schemas", () => {
  it("accepts exact decimal receipt totals and line values", () => {
    expect(supplierReceiptDetailSchema.safeParse(receipt).success).toBe(true);
  });

  it("validates paginated receipt rows and counts", () => {
    expect(
      supplierReceiptPageSchema.safeParse({
        items: [{ ...receipt, items: undefined, item_count: 1 }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
  });

  it("accepts a positive decimal quantity and zero unit cost", () => {
    expect(
      createSupplierReceiptSchema.safeParse({
        supplier_id: id,
        received_at: "2026-09-24",
        items: [
          {
            stock_item_id: id,
            quantity_received: "0002.5000",
            unit_cost: "0.00",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects impossible dates, zero quantities, negative costs, and numeric inputs", () => {
    const base = {
      supplier_id: id,
      received_at: "2026-09-24",
      items: [{ stock_item_id: id, quantity_received: "1", unit_cost: "1" }],
    };
    const invalid = [
      { ...base, received_at: "2026-02-30" },
      {
        ...base,
        items: [{ ...base.items[0], quantity_received: "0" }],
      },
      { ...base, items: [{ ...base.items[0], unit_cost: "-0.01" }] },
      { ...base, items: [{ ...base.items[0], quantity_received: 1 }] },
      { ...base, items: [] },
    ];

    for (const input of invalid) {
      expect(createSupplierReceiptSchema.safeParse(input).success).toBe(false);
    }
  });
});
