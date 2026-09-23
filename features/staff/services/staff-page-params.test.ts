import { describe, expect, it } from "vitest";
import {
  createStaffPageHref,
  parseStaffPageFilters,
  resolveStaffBranchSelection,
} from "@/features/staff/services/staff-page-params";

const firstBranch = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const secondBranch = "28af8c76-1e33-4745-a03c-7f7fa2db640a";

describe("staff page parameters", () => {
  it("builds staff page URLs while preserving active filters", () => {
    expect(createStaffPageHref(3, secondBranch, "Alex Lee & Co")).toBe(
      `/staff?page=3&branch_id=${secondBranch}&search=Alex+Lee+%26+Co`,
    );
  });

  it("normalizes invalid pagination and bounds search text", () => {
    expect(
      parseStaffPageFilters({
        page: ["-2", "9"],
        search: `  ${"a".repeat(140)}  `,
        branch_id: "invalid",
      }),
    ).toEqual({
      page: 1,
      search: "a".repeat(120),
      requestedBranchId: undefined,
    });
  });

  it("normalizes valid UUID filters before comparing branch assignments", () => {
    expect(
      parseStaffPageFilters({ branch_id: firstBranch.toUpperCase() })
        .requestedBranchId,
    ).toBe(firstBranch);
  });

  it("uses the requested branch or the first assignment for scoped staff", () => {
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [firstBranch, secondBranch],
        requestedBranchId: secondBranch,
      }),
    ).toEqual({ status: "ready", branchId: secondBranch });
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [firstBranch, secondBranch],
      }),
    ).toEqual({ status: "ready", branchId: firstBranch });
  });

  it("rejects an explicitly requested branch outside the user's assignments", () => {
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [firstBranch],
        requestedBranchId: secondBranch,
      }),
    ).toEqual({ status: "out-of-scope" });
  });

  it("allows protected Super Admin to choose a branch or all branches", () => {
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: true,
        assignedBranchIds: [],
        requestedBranchId: secondBranch,
      }),
    ).toEqual({ status: "ready", branchId: secondBranch });
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: true,
        assignedBranchIds: [],
      }),
    ).toEqual({ status: "ready", branchId: undefined });
  });

  it("does not query staff without any branch assignment for ordinary users", () => {
    expect(
      resolveStaffBranchSelection({
        isSuperAdmin: false,
        assignedBranchIds: [],
      }),
    ).toEqual({ status: "no-branch" });
  });
});
