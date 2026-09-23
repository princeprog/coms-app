import { describe, expect, it } from "vitest";
import {
  createBranchProductsHref,
  parseBranchProductFilters,
} from "./branch-product-page-params";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("branch product page parameters", () => {
  it("normalizes URL filters and ignores invalid page and branch values", () => {
    expect(
      parseBranchProductFilters({
        page: ["0", "4"],
        branch_id: "not-a-uuid",
        search: "  chicken  ",
        is_available: "false",
      }),
    ).toEqual({
      page: 1,
      search: "chicken",
      isAvailable: false,
    });
  });

  it("keeps branch, search, availability, and page when building navigation URLs", () => {
    const href = createBranchProductsHref({
      branchId,
      page: 3,
      search: "chicken sandwich",
      isAvailable: true,
    });
    const url = new URL(href, "https://coms.local");

    expect(url.pathname).toBe("/branch-products");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      branch_id: branchId,
      page: "3",
      search: "chicken sandwich",
      is_available: "true",
    });
  });

  it("omits default filters from the URL", () => {
    expect(
      createBranchProductsHref({
        branchId,
        page: 1,
        search: " ",
        isAvailable: undefined,
      }),
    ).toBe(`/branch-products?branch_id=${branchId}`);
  });
});
