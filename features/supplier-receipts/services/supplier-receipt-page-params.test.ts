import { describe, expect, it } from "vitest";
import {
  createSupplierReceiptHref,
  parseSupplierReceiptPageFilters,
} from "./supplier-receipt-page-params";

describe("supplier receipt page filters", () => {
  it("retains combined date, exact decimal cost, and sort filters across pagination", () => {
    const filters = parseSupplierReceiptPageFilters({
      page: "2",
      search: " Farm ",
      received_from: "2026-10-01",
      received_to: "2026-10-05",
      min_cost: "9007199254740993.1234",
      max_cost: "9007199254740994.25",
      sort: "cost_highest",
    });
    expect(createSupplierReceiptHref(filters)).toBe(
      "/receipts?page=2&search=Farm&received_from=2026-10-01&received_to=2026-10-05&min_cost=9007199254740993.1234&max_cost=9007199254740994.25&sort=cost_highest",
    );
    expect(
      parseSupplierReceiptPageFilters({
        received_from: "2026-02-30",
        received_to: "no-date",
        min_cost: "-1",
        max_cost: "1e2",
        sort: "unsafe",
      }),
    ).toEqual({ page: 1, search: "" });
  });
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
