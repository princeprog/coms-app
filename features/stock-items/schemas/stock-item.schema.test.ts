import { describe, expect, it } from "vitest";
import {
  createStockItemSchema,
  stockItemPageSchema,
  updateStockItemSchema,
} from "./stock-item.schema";

const stockItem = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  stock_item_name: "Chicken breast",
  category: "Poultry",
  unit: "kg",
  is_active: true,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

describe("stock-item schemas", () => {
  it("trims required stock item fields before submitting them", () => {
    expect(
      createStockItemSchema.parse({
        stock_item_name: " Chicken breast ",
        category: " Poultry ",
        unit: " kg ",
      }),
    ).toEqual({
      stock_item_name: "Chicken breast",
      category: "Poultry",
      unit: "kg",
    });
  });

  it("rejects blank required values and empty updates", () => {
    expect(
      createStockItemSchema.safeParse({
        stock_item_name: " ",
        category: "Poultry",
        unit: "kg",
      }).success,
    ).toBe(false);
    expect(updateStockItemSchema.safeParse({}).success).toBe(false);
  });

  it("validates paginated stock-item responses before rendering", () => {
    expect(
      stockItemPageSchema.safeParse({
        items: [stockItem],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
    expect(
      stockItemPageSchema.safeParse({
        items: [{ ...stockItem, unit: null }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
  });
});
