import { describe, expect, it } from "vitest";
import {
  createSupplierReceiptHref,
  parseSupplierReceiptPageFilters,
} from "./supplier-receipt-page-params";

describe("supplier receipt page filters", () => {
  it("defaults invalid pages while trimming supplier search", () => {
    expect(
      parseSupplierReceiptPageFilters({
        page: "invalid",
        search: "  North Farm  ",
        status: "UNKNOWN",
      }),
    ).toEqual({ page: 1, search: "North Farm" });
  });

  it("bounds search and page values and ignores retired status filters", () => {
    expect(
      parseSupplierReceiptPageFilters({
        page: "1000001",
        search: "x".repeat(140),
      }),
    ).toEqual({ page: 1, search: "x".repeat(100) });
  });

  it("preserves supplier search in pagination links", () => {
    expect(
      createSupplierReceiptHref({
        page: 2,
        search: " North Farm ",
      }),
    ).toBe("/receipts?page=2&search=North+Farm");
  });
});
