import { describe, expect, it } from "vitest";
import {
  createDispatchHref,
  parseDispatchPageFilters,
} from "./dispatch-page-params";

describe("dispatch page parameters", () => {
  it("retains branch search and sort with status and discrepancy pagination", () => {
    const filters = parseDispatchPageFilters({
      page: "2",
      search: " Downtown ",
      status: "IN_TRANSIT",
      discrepancy_status: "OPEN",
      sort: "branch_asc",
    });
    expect(createDispatchHref(filters)).toBe(
      "/dispatches?page=2&status=IN_TRANSIT&discrepancy_status=OPEN&search=Downtown&sort=branch_asc",
    );
    expect(
      parseDispatchPageFilters({ sort: "unsafe", search: "x".repeat(101) })
        .search,
    ).toHaveLength(100);
  });
  it("accepts a valid page and status and falls back from invalid values", () => {
    expect(
      parseDispatchPageFilters({ page: "3", status: "PARTIALLY_RECEIVED" }),
    ).toEqual({
      page: 3,
      status: "PARTIALLY_RECEIVED",
      discrepancyStatus: "all",
    });
    expect(
      parseDispatchPageFilters({ page: "0", status: "NOT_A_STATUS" }),
    ).toEqual({ page: 1, status: "all", discrepancyStatus: "all" });
  });

  it("builds a canonical dispatch URL while retaining status on pagination", () => {
    expect(
      createDispatchHref({
        page: 2,
        status: "IN_TRANSIT",
        discrepancyStatus: "all",
      }),
    ).toBe("/dispatches?page=2&status=IN_TRANSIT");
    expect(
      createDispatchHref({ page: 1, status: "all", discrepancyStatus: "all" }),
    ).toBe("/dispatches");
  });

  it("parses and retains a discrepancy status in the URL", () => {
    const filters = parseDispatchPageFilters({
      page: "2",
      status: "IN_TRANSIT",
      discrepancy_status: "OPEN",
    });
    expect(filters).toEqual({
      page: 2,
      status: "IN_TRANSIT",
      discrepancyStatus: "OPEN",
    });
    expect(createDispatchHref(filters)).toBe(
      "/dispatches?page=2&status=IN_TRANSIT&discrepancy_status=OPEN",
    );
    expect(
      parseDispatchPageFilters({ discrepancy_status: "not-a-state" })
        .discrepancyStatus,
    ).toBe("all");
  });
});
