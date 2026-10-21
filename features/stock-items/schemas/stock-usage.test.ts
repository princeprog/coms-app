import { describe, expect, it } from "vitest";
import {
  createStockItemSchema,
  updateStockItemSchema,
} from "./stock-item.schema";
describe("simple stock item contracts", () => {
  it("creates stock without a usage classification", () => {
    expect(
      createStockItemSchema.safeParse({
        stock_item_name: "Bottled drink",
        category: "Beverages",
        unit: "pcs",
      }).success,
    ).toBe(true);
  });
  it("rejects retired stock usage inputs", () => {
    expect(
      updateStockItemSchema.safeParse({ usage_types: ["INGREDIENT"] }).success,
    ).toBe(false);
  });
  it("accepts only recipe or operating-supply recipe use", () => {
    expect(
      updateStockItemSchema.safeParse({ recipe_use: "OPERATING_SUPPLY" })
        .success,
    ).toBe(true);
    expect(
      updateStockItemSchema.safeParse({ recipe_use: "PACKAGING" }).success,
    ).toBe(false);
  });
});
