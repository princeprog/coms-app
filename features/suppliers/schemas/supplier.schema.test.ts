import { describe, expect, it } from "vitest";
import {
  createSupplierSchema,
  supplierPageSchema,
  updateSupplierSchema,
} from "./supplier.schema";

const supplier = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  supplier_name: "North Farm Supply",
  contact_person: null,
  contact_number: null,
  email: "orders@northfarm.test",
  address: null,
  is_active: true,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

describe("supplier schemas", () => {
  it("normalizes supplier text and clears blank optional contact fields", () => {
    expect(
      createSupplierSchema.parse({
        supplier_name: "  North Farm Supply  ",
        contact_person: " ",
        contact_number: " +63 900 111 2222 ",
        email: " ORDERS@NORTHFARM.TEST ",
        address: null,
      }),
    ).toEqual({
      supplier_name: "North Farm Supply",
      contact_person: null,
      contact_number: "+63 900 111 2222",
      email: "orders@northfarm.test",
      address: null,
    });
  });

  it("rejects malformed and empty supplier updates", () => {
    expect(updateSupplierSchema.safeParse({}).success).toBe(false);
    expect(
      updateSupplierSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("validates paginated supplier responses before the page renders them", () => {
    expect(
      supplierPageSchema.safeParse({
        items: [supplier],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
    expect(
      supplierPageSchema.safeParse({
        items: [{ ...supplier, id: "invalid" }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
  });
});
