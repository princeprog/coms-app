// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { StaffDirectory } from "@/features/staff/components/staff-directory";

vi.mock("@/features/staff/services/staff-actions", () => ({
  createStaffAction: vi.fn(),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const staffPage = {
  items: [
    {
      id: "4b450453-7640-4719-990c-29e97b77e3e9",
      email: "alex@example.com",
      full_name: "Alex Staff",
      contact_number: "09170000000",
      is_active: true,
      role_id: "4",
      role_code: "BRANCH_MANAGER",
      role_name: "Branch Manager",
      branch_ids: [branchId],
    },
  ],
  total: 26,
  page: 1,
  page_size: 25,
};
const branchOptions = [
  { id: branchId, name: "Manila North" },
  { id: "28af8c76-1e33-4745-a03c-7f7fa2db640a", name: "Manila South" },
];

function renderDirectory(
  overrides: Partial<ComponentProps<typeof StaffDirectory>> = {},
) {
  return render(
    <StaffDirectory
      staff={staffPage}
      branchOptions={branchOptions}
      selectedBranchId={branchId}
      search="Alex"
      isSuperAdmin={false}
      canCreateStaff={false}
      canReadRoles={false}
      roleOptions={[]}
      roleOptionsFailed={false}
      {...overrides}
    />,
  );
}

describe("staff directory", () => {
  it("shows staff identity, role, account state, and selected branch", () => {
    renderDirectory();

    expect(screen.getByText("Alex Staff")).toBeTruthy();
    expect(screen.getByText("alex@example.com")).toBeTruthy();
    expect(screen.getByText("Branch Manager")).toBeTruthy();
    expect(screen.getByText("Active account")).toBeTruthy();
    expect(screen.getByLabelText("Branch scope")).toHaveProperty(
      "value",
      branchId,
    );
  });

  it("preserves branch and search filters in pagination links", () => {
    renderDirectory();

    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/staff?page=2&branch_id=${branchId}&search=Alex`);
  });

  it("shows a useful empty state and lets operators clear the search", () => {
    renderDirectory({ staff: { ...staffPage, items: [], total: 0 } });

    expect(screen.getByText("No staff match this search.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Clear search" }).getAttribute("href"),
    ).toBe(`/staff?branch_id=${branchId}`);
  });

  it("offers all-branch filtering only to the protected Super Admin", () => {
    renderDirectory({ isSuperAdmin: true, selectedBranchId: undefined });

    expect(screen.getByRole("option", { name: "All branches" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Manila North" })).toBeTruthy();
  });
});
