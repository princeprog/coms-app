import { describe, it, expect } from "vitest";
import { purchaseInputSchema, purchaseQuerySchema } from "./purchase.schema";
import { calculateSupplierReceiptTotal } from "@/features/supplier-receipts/services/supplier-receipt-total";
const input = {
  purchase_date: "2026-01-01",
  items: [
    {
      stock_item_id: "10000000-0000-4000-8000-000000000001",
      quantity_received: "2.5",
      unit_cost: "13.25",
    },
  ],
};
describe("direct purchase contract", () => {
  it("requires an explicit cost and positive quantity", () => {
    expect(
      purchaseInputSchema.safeParse({
        ...input,
        items: [{ ...input.items[0], unit_cost: "" }],
      }).success,
    ).toBe(false);
    expect(
      purchaseInputSchema.safeParse({
        ...input,
        items: [{ ...input.items[0], unit_cost: "0" }],
      }).success,
    ).toBe(true);
    expect(
      purchaseInputSchema.safeParse({
        ...input,
        items: [{ ...input.items[0], quantity_received: "0" }],
      }).success,
    ).toBe(false);
  });
  it("rejects future dates, duplicate stock and branch routing", () => {
    for (const patch of [
      { purchase_date: "2099-01-01" },
      { purchase_date: "2026-02-30" },
      { items: [...input.items, ...input.items] },
      { branch_id: "branch" },
    ])
      expect(
        purchaseInputSchema.safeParse({ ...input, ...patch }).success,
      ).toBe(false);
  });
  it("does not require a registered supplier and preserves exact totals", () => {
    expect(purchaseInputSchema.parse(input)).toEqual(input);
    expect(calculateSupplierReceiptTotal(input)).toBe("33.125");
  });
  it("uses only the supported pagination sizes", () => {
    expect(purchaseQuerySchema.parse({}).page_size).toBe(10);
    expect(purchaseQuerySchema.parse({ page_size: "30" }).page_size).toBe(30);
    expect(purchaseQuerySchema.parse({ page_size: "50" }).page_size).toBe(50);
    expect(purchaseQuerySchema.parse({ page_size: "20" }).page_size).toBe(10);
  });
});
