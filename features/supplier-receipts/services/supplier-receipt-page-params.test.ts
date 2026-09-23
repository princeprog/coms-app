import { describe, expect, it } from "vitest";
import {
  createSupplierReceiptHref,
  parseSupplierReceiptPageFilters,
} from "./supplier-receipt-page-params";

describe("supplier receipt page filters", () => {
  it("defaults invalid pages and status while trimming supplier search", () => {
    expect(
      parseSupplierReceiptPageFilters({
        page: "invalid",
        search: "  North Farm  ",
        status: "UNKNOWN",
      }),
    ).toEqual({ page: 1, search: "North Farm", status: "all" });
  });

  it("accepts a receipt state and bounds search and page values", () => {
    expect(
      parseSupplierReceiptPageFilters({
        page: "1000001",
        search: "x".repeat(140),
        status: "DRAFT",
      }),
    ).toEqual({ page: 1, search: "x".repeat(100), status: "DRAFT" });
  });

  it("preserves search and status in receipt pagination links", () => {
    expect(
      createSupplierReceiptHref({
        page: 2,
        search: " North Farm ",
        status: "POSTED",
      }),
    ).toBe("/receipts?page=2&search=North+Farm&status=POSTED");
  });
});
