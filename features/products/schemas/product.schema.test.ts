import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  productPageSchema,
  updateProductSchema,
} from "./product.schema";

const product = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  product_name: "Chicken sandwich",
  description: "Grilled chicken with lettuce.",
  is_active: true,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

describe("product schemas", () => {
  it("trims product names and converts a blank optional description to null", () => {
    expect(
      createProductSchema.parse({
        product_name: " Chicken sandwich ",
        description: "   ",
      }),
    ).toEqual({ product_name: "Chicken sandwich", description: null });
  });

  it("allows clearing a description but rejects an empty update", () => {
    expect(updateProductSchema.parse({ description: null })).toEqual({
      description: null,
    });
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  it("validates paginated product responses before rendering", () => {
    expect(
      productPageSchema.safeParse({
        items: [product],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
    expect(
      productPageSchema.safeParse({
        items: [{ ...product, product_name: " " }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
  });
});
