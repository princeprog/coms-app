import { describe, expect, it } from "vitest";
import {
  branchProductAvailabilitySchema,
  branchProductCreateSchema,
  branchProductPageSchema,
  branchProductSchema,
} from "./branch-product.schema";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const timestamp = "2026-09-24T01:30:00.000Z";

const offer = {
  branch_id: branchId,
  product_id: productId,
  product_name: "Chicken sandwich",
  description: null,
  category_id: "aa000000-0000-4000-8000-000000000001",
  category_name: "Rice meals",
  category_is_active: true,
  product_is_active: true,
  price: "125.0000",
  is_available: true,
  created_at: timestamp,
  updated_at: timestamp,
};

describe("branch product schemas", () => {
  it("preserves exact API price strings in paginated offer data", () => {
    const parsed = branchProductPageSchema.safeParse({
      items: [offer],
      total: 1,
      page: 1,
      page_size: 25,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.items[0].price).toBe("125.0000");
  });

  it.each(["0", "000.25", "125.0000"])(
    "accepts nonnegative decimal price %s without numeric coercion",
    (price) => {
      expect(branchProductSchema.safeParse({ ...offer, price }).success).toBe(
        true,
      );
    },
  );

  it.each(["-1", "1e2", "1.2.3", 125])(
    "rejects malformed price %s",
    (price) => {
      expect(branchProductSchema.safeParse({ ...offer, price }).success).toBe(
        false,
      );
    },
  );

  it("validates product selection and availability as strict inputs", () => {
    expect(
      branchProductCreateSchema.safeParse({
        product_id: productId,
        service_types: ["TAKEAWAY"],
      }).success,
    ).toBe(true);
    expect(
      branchProductCreateSchema.safeParse({
        product_id: productId,
        price: "99.50",
        is_available: true,
      }).success,
    ).toBe(false);
    expect(
      branchProductAvailabilitySchema.safeParse({ is_available: false })
        .success,
    ).toBe(true);
    expect(
      branchProductAvailabilitySchema.safeParse({ is_available: "false" })
        .success,
    ).toBe(false);
  });
});
