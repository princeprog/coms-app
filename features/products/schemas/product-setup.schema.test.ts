import { describe, expect, it } from "vitest";
import { productSetupInputSchema } from "./product-setup.schema";
const product = {
  category_id: "00000000-0000-4000-8000-000000000002",
  product_name: "Chicken meal",
  price: "55.00001",
  description: null,
  service_types: ["TAKEAWAY"],
  branch_ids: [],
};
describe("simple product contracts", () => {
  it("requires price and one atomic product payload", () => {
    expect(
      productSetupInputSchema.safeParse({
        expected_product_revision: 0,
        product,
      }).success,
    ).toBe(true);
    const unpriced = {
      product_name: product.product_name,
      description: product.description,
      service_types: product.service_types,
      branch_ids: product.branch_ids,
    };
    expect(
      productSetupInputSchema.safeParse({
        expected_product_revision: 0,
        product: unpriced,
      }).success,
    ).toBe(false);
    expect(
      productSetupInputSchema.safeParse({
        expected_product_revision: 0,
        product,
        recipe: { items: [] },
      }).success,
    ).toBe(false);
  });
});
