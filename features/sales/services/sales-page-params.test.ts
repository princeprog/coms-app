import { describe, expect, it } from "vitest";
import { createSalesHref, parseSalesPageFilters } from "./sales-page-params";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("POS page parameters", () => {
  it("preserves the active section through history pagination and detail navigation", () => {
    const filters = parseSalesPageFilters({
      view: "history",
      history_page: "2",
    });
    expect(filters.view).toBe("history");
    expect(createSalesHref({ ...filters, saleId })).toContain("view=history");
    expect(parseSalesPageFilters({ view: "invalid" })).not.toHaveProperty(
      "view",
    );
  });
  it("preserves an applied service type through menu and sale navigation", () => {
    const filters = parseSalesPageFilters({
      service_type: "TAKEAWAY",
      page: "2",
    });
    expect(filters).toMatchObject({ serviceType: "TAKEAWAY", page: 2 });
    expect(createSalesHref({ ...filters, saleId })).toContain(
      "service_type=TAKEAWAY",
    );
    expect(
      parseSalesPageFilters({ service_type: "DELIVERY" }),
    ).not.toHaveProperty("serviceType");
  });
  it("normalizes pagination, search, and valid selected IDs", () => {
    expect(
      parseSalesPageFilters({
        branch_id: branchId.toUpperCase(),
        page: "3",
        history_page: "2",
        search: "  chicken sandwich  ",
        sale_id: saleId,
      }),
    ).toEqual({
      branchId,
      page: 3,
      historyPage: 2,
      search: "chicken sandwich",
      saleId,
    });
  });

  it("ignores malformed IDs and out-of-range or repeated parameters", () => {
    expect(
      parseSalesPageFilters({
        branch_id: "bad",
        page: ["0", "4"],
        history_page: "1000001",
        search: "x".repeat(140),
        sale_id: "bad",
      }),
    ).toEqual({ page: 1, historyPage: 1, search: "x".repeat(100) });
  });

  it("preserves the selected branch and other view state in detail links", () => {
    const href = createSalesHref({
      branchId,
      page: 2,
      historyPage: 3,
      search: "iced tea",
      saleId,
    });
    const url = new URL(href, "https://coms.local");
    expect(url.pathname).toBe("/pos");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      branch_id: branchId,
      page: "2",
      history_page: "3",
      search: "iced tea",
      sale_id: saleId,
    });
  });
});
