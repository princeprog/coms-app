import { describe, expect, it } from "vitest";
import {
  parseInventoryPageFilters,
  createInventoryHref,
  resolveInventoryBranchSelection,
} from "./inventory-page-params";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("inventory page filters", () => {
  it("defaults to commissary inventory and trims the search", () => {
    expect(
      parseInventoryPageFilters({ page: "invalid", search: "  Flour  " }),
    ).toEqual({ page: 1, scope: "COMMISSARY", search: "Flour" });
  });

  it("accepts a valid branch scope and clamps the page range", () => {
    expect(
      parseInventoryPageFilters({
        page: "1000001",
        scope: "BRANCH",
        branch_id: branchId,
        search: "x".repeat(140),
      }),
    ).toEqual({
      page: 1,
      scope: "BRANCH",
      requestedBranchId: branchId,
      search: "x".repeat(120),
    });
  });

  it("drops invalid branch IDs and rejects out-of-scope requests", () => {
    expect(
      parseInventoryPageFilters({
        scope: "BRANCH",
        branch_id: "not-a-uuid",
      }),
    ).toEqual({ page: 1, scope: "BRANCH", search: "" });
    expect(
      resolveInventoryBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [branchId],
        requestedBranchId: "540a8340-3556-47a3-9858-10a4f29d2611",
      }),
    ).toEqual({ status: "out-of-scope" });
  });

  it("selects the first assignment and allows global Super Admin selection", () => {
    expect(
      resolveInventoryBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [branchId],
      }),
    ).toEqual({ status: "ready", branchId });
    expect(
      resolveInventoryBranchSelection({
        isSuperAdmin: true,
        assignedBranchIds: [],
      }),
    ).toEqual({ status: "ready", branchId: undefined });
    expect(
      resolveInventoryBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [],
      }),
    ).toEqual({ status: "no-branch" });
  });

  it("builds inventory links with scope, branch, page, and search filters", () => {
    expect(
      createInventoryHref({
        scope: "BRANCH",
        branchId,
        page: 2,
        search: " Flour ",
      }),
    ).toBe(`/inventory?scope=BRANCH&branch_id=${branchId}&page=2&search=Flour`);
  });
});
