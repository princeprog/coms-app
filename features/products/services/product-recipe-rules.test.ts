import { describe, expect, it } from "vitest";
import { buildRecipePayload, type RecipeRow } from "./product-recipe-rules";

const stock = (id: string) => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  stock_item_name: `Item ${id}`,
  unit: "kg",
  is_active: true,
});
const row = (key: string, patch: Partial<RecipeRow>): RecipeRow => ({
  key,
  stock: null,
  quantity: "",
  scope: "ALL",
  ...patch,
});
const both = ["DINE_IN", "TAKEAWAY"] as const;

describe("buildRecipePayload", () => {
  it("ignores untouched blank lines and trims quantities", () => {
    const result = buildRecipePayload(
      [row("a", {}), row("b", { stock: stock("1"), quantity: " 0.25 " })],
      [...both],
    );
    expect(result.errors).toEqual({});
    expect(result.lines).toEqual([
      { stock_item_id: stock("1").id, quantity: "0.25", usage_scope: "ALL" },
    ]);
  });

  it("reports missing stock, zero and over-precise quantities per line", () => {
    const result = buildRecipePayload(
      [
        row("a", { quantity: "1" }),
        row("b", { stock: stock("1"), quantity: "0" }),
        row("c", { stock: stock("2"), quantity: "1.12345" }),
      ],
      [...both],
    );
    expect(result.errors.a?.stock).toBe("Choose a stock item.");
    expect(result.errors.b?.quantity).toMatch(/greater than zero/);
    expect(result.errors.c?.quantity).toMatch(/4 decimal places/);
  });

  it("allows one line per service but not alongside an every-sale line", () => {
    const perService = buildRecipePayload(
      [
        row("a", { stock: stock("1"), quantity: "1", scope: "DINE_IN" }),
        row("b", { stock: stock("1"), quantity: "2", scope: "TAKEAWAY" }),
      ],
      [...both],
    );
    expect(perService.errors).toEqual({});
    const mixed = buildRecipePayload(
      [
        row("a", { stock: stock("1"), quantity: "1", scope: "ALL" }),
        row("b", { stock: stock("1"), quantity: "2", scope: "TAKEAWAY" }),
      ],
      [...both],
    );
    expect(mixed.errors.b?.stock).toMatch(/Already in the recipe/);
  });

  it("treats every line as every-sale when the product has one service", () => {
    const result = buildRecipePayload(
      [row("a", { stock: stock("1"), quantity: "1", scope: "DINE_IN" })],
      ["TAKEAWAY"],
    );
    expect(result.lines[0]?.usage_scope).toBe("ALL");
  });
});
