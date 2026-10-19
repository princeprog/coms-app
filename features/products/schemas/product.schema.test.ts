import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  productPageSchema,
  updateProductSchema,
} from "./product.schema";

const product = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  category_name: "Meals",
  category_is_active: true,
  category_id: "00000000-0000-4000-8000-000000000002",
  product_name: "Chicken sandwich",
  description: "Grilled chicken with lettuce.",
  price: "125.0001",
  price_revision: 1,
  setup_revision: 1,
  service_types: ["DINE_IN", "TAKEAWAY"],
  is_active: true,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

describe("product schemas", () => {
  it("requires a valid category on create and rejects null category updates", () => {
    const input = {
      product_name: "Meal",
      price: "5",
      service_types: ["DINE_IN"],
    };
    for (const category_id of [undefined, null, "", "not-a-category"]) {
      expect(
        createProductSchema.safeParse({ ...input, category_id }).success,
      ).toBe(false);
    }
    expect(
      updateProductSchema.safeParse({
        category_id: null,
        expected_product_revision: 1,
      }).success,
    ).toBe(false);
    expect(
      createProductSchema.safeParse({ ...input, category_id: product.id })
        .success,
    ).toBe(true);
  });
  it("trims product names and converts a blank optional description to null", () => {
    expect(
      createProductSchema.parse({
        category_id: "00000000-0000-4000-8000-000000000002",
        product_name: " Chicken sandwich ",
        description: "   ",
        price: "125.0001",
        service_types: ["DINE_IN", "TAKEAWAY"],
      }),
    ).toEqual({
      category_id: "00000000-0000-4000-8000-000000000002",
      product_name: "Chicken sandwich",
      description: null,
      price: "125.0001",
      service_types: ["DINE_IN", "TAKEAWAY"],
      branch_ids: [],
    });
  });

  it("allows clearing a description but rejects an empty update", () => {
    expect(
      updateProductSchema.parse({
        description: null,
        expected_product_revision: 1,
      }),
    ).toEqual({
      description: null,
      expected_product_revision: 1,
    });
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  it("validates paginated product responses before rendering", () => {
    for (const key of [
      "category_id",
      "category_name",
      "category_is_active",
    ] as const) {
      for (const value of [undefined, null]) {
        expect(
          productPageSchema.safeParse({
            items: [{ ...product, [key]: value }],
            total: 1,
            page: 1,
            page_size: 10,
          }).success,
        ).toBe(false);
      }
    }
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
