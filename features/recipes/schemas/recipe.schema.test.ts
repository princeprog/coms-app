import { describe, expect, it } from "vitest";
import { recipeInputSchema, recipeResponseSchema } from "./recipe.schema";

const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("recipe schemas", () => {
  it("preserves positive decimal quantities and inactive stock history", () => {
    const parsed = recipeResponseSchema.safeParse({
      product: {
        id: productId,
        product_name: "Chicken sandwich",
        description: null,
        is_active: true,
      },
      items: [
        {
          product_id: productId,
          stock_item_id: stockItemId,
          stock_item_name: "Flour",
          unit: "kg",
          stock_item_is_active: false,
          quantity_required: "0.0250",
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0].quantity_required).toBe("0.0250");
      expect(parsed.data.items[0].stock_item_is_active).toBe(false);
    }
  });

  it("accepts nonzero decimal-string ingredients without numeric coercion", () => {
    expect(
      recipeInputSchema.safeParse({
        items: [{ stock_item_id: stockItemId, quantity_required: "0.0001" }],
      }).success,
    ).toBe(true);
  });

  it.each(["0", "000.000", "1e-3", "-1", "1.2.3", 1])(
    "rejects invalid quantity %s",
    (quantity_required) => {
      expect(
        recipeInputSchema.safeParse({
          items: [{ stock_item_id: stockItemId, quantity_required }],
        }).success,
      ).toBe(false);
    },
  );

  it("rejects duplicate stock items and unknown fields", () => {
    expect(
      recipeInputSchema.safeParse({
        items: [
          { stock_item_id: stockItemId, quantity_required: "1" },
          { stock_item_id: stockItemId, quantity_required: "2" },
        ],
      }).success,
    ).toBe(false);
    expect(
      recipeInputSchema.safeParse({
        items: [{ stock_item_id: stockItemId, quantity_required: "1" }],
        unknown: true,
      }).success,
    ).toBe(false);
  });
});
