import { describe, expect, it } from "vitest";
import {
  createStockRequestHref,
  parseStockRequestPageFilters,
} from "./stock-request-page-params";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("stock request page filters", () => {
  it("parses supported status, branch, and page parameters", () => {
    expect(
      parseStockRequestPageFilters({
        page: "3",
        status: "PENDING",
        branch_id: branchId,
      }),
    ).toEqual({ page: 3, status: "PENDING", branch_id: branchId });
  });

  it("falls back safely for invalid page, status, and branch values", () => {
    expect(
      parseStockRequestPageFilters({
        page: "-1",
        status: "REMOVED",
        branch_id: "bad-id",
      }),
    ).toEqual({ page: 1, status: "all", branch_id: "all" });
  });

  it("preserves active filters in page links", () => {
    expect(
      createStockRequestHref({
        page: 2,
        status: "PENDING",
        branch_id: branchId,
      }),
    ).toBe(`/replenishment?page=2&status=PENDING&branch_id=${branchId}`);
  });
});
