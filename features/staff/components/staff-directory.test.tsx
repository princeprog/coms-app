// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { StaffDirectory } from "@/features/staff/components/staff-directory";

vi.mock("@/features/staff/services/staff-actions", () => ({
  createStaffAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const staffPage = {
  items: [
    {
      id: "4b450453-7640-4719-990c-29e97b77e3e9",
      email: "alex@example.test",
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
const staffRoles = [
  {
    id: "4",
    code: "BRANCH_MANAGER",
    role_name: "Branch Manager",
    is_system: false,
    is_predefined: true,
    is_active: true,
    permission_keys: [],
  },
];
const allManagementPermissions = {
  canUpdate: true,
  canAssignRole: true,
  canAssignBranches: true,
  canDeactivate: true,
  canReadRoles: true,
  canReadBranches: true,
};

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
  it("presents staff records in a compact table with the planned columns", () => {
    renderDirectory();

    const table = screen.getByRole("table", { name: "Staff directory" });
    expect(table).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Staff member" }),
    ).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Branch assignments" }),
    ).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Contact" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(
      screen.getByRole("cell", { name: /Alex Staff alex@example\.test/ }),
    ).toBeTruthy();
  });

  it("opens full staff details in a sheet for a read-only operator", async () => {
    const user = userEvent.setup();
    renderDirectory();

    await user.click(
      screen.getByRole("button", { name: "View details for Alex Staff" }),
    );

    const sheet = screen.getByRole("dialog", { name: "Alex Staff" });
    expect(within(sheet).getByText("09170000000")).toBeTruthy();
    expect(within(sheet).getByText("Manila North")).toBeTruthy();
    expect(
      within(sheet).getByText(/do not have access to change/i),
    ).toBeTruthy();
  });

  it("keeps staff creation inside an explicit add-staff sheet", async () => {
    const user = userEvent.setup();
    renderDirectory({
      canCreateStaff: true,
      canReadRoles: true,
      roleOptions: staffRoles,
    });

    expect(screen.queryByLabelText("Email")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add staff" }));

    expect(
      screen.getByRole("dialog", { name: "Add a staff account" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create staff" })).toBeTruthy();
  });

  it("keeps a dirty management sheet open until edits are discarded", async () => {
    const user = userEvent.setup();
    renderDirectory({ managementPermissions: allManagementPermissions });

    await user.click(screen.getByRole("button", { name: "Manage Alex Staff" }));
    await user.click(screen.getByText("Edit profile", { selector: "summary" }));
    const name = screen.getByLabelText("Full name for Alex Staff");
    await user.clear(name);
    await user.type(name, "Alex Draft");
    await user.click(
      screen.getByRole("button", { name: "Close staff details" }),
    );
    expect(
      screen.getByRole("alertdialog", {
        name: /discard unsaved staff changes/i,
      }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(name).toHaveProperty("value", "Alex Draft");
    await user.click(
      screen.getByRole("button", { name: "Close staff details" }),
    );
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog", { name: "Alex Staff" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Manage Alex Staff" }));
    await user.click(screen.getByText("Edit profile", { selector: "summary" }));
    expect(screen.getByLabelText("Full name for Alex Staff")).toHaveProperty(
      "value",
      "Alex Staff",
    );
  });

  it("asks before closing a populated create sheet and resets only after discard", async () => {
    const user = userEvent.setup();
    renderDirectory({
      canCreateStaff: true,
      canReadRoles: true,
      roleOptions: staffRoles,
    });

    await user.click(screen.getByRole("button", { name: "Add staff" }));
    const email = screen.getByLabelText("Email");
    await user.type(email, "new.staff@example.test");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", {
        name: /discard unsaved staff changes/i,
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(email).toHaveProperty("value", "new.staff@example.test");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(
      screen.queryByRole("dialog", { name: "Add a staff account" }),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add staff" }));
    expect(screen.getByLabelText("Email")).toHaveProperty("value", "");
  });

  it("shows staff identity, role, status, and selected branch", () => {
    renderDirectory();

    expect(screen.getByText("Alex Staff")).toBeTruthy();
    expect(screen.getByText("alex@example.test")).toBeTruthy();
    expect(screen.getByText("Branch Manager")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Branch scope" }).textContent,
    ).toContain("Manila North");
  });

  it("labels a staff member without a role as unassigned", () => {
    const unassignedPage = {
      ...staffPage,
      items: [
        {
          ...staffPage.items[0],
          role_id: null,
          role_code: null,
          role_name: null,
        },
      ],
    };
    renderDirectory({ staff: unassignedPage });

    expect(screen.getByText("Unassigned")).toBeTruthy();
  });

  it("preserves branch and search filters in pagination links", () => {
    renderDirectory();

    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/staff?page=2&branch_id=${branchId}&search=Alex`);
  });

  it("shows a useful empty state and lets operators clear the search", () => {
    renderDirectory({ staff: { ...staffPage, items: [], total: 0 } });

    expect(screen.getByText("No staff match this search")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Clear search" }).getAttribute("href"),
    ).toBe(`/staff?branch_id=${branchId}`);
  });

  it("offers all-branch filtering only to the protected Super Admin", async () => {
    const user = userEvent.setup();
    renderDirectory({ isSuperAdmin: true, selectedBranchId: undefined });

    await user.click(screen.getByRole("combobox", { name: "Branch scope" }));
    expect(screen.getByRole("option", { name: "All branches" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Manila North" })).toBeTruthy();
  });

  it("keeps GET search submission on the current branch and resets pagination", () => {
    renderDirectory();

    const searchForm = screen.getByRole("form", { name: "Search staff" });
    expect(searchForm.getAttribute("action")).toBe("/staff");
    expect(searchForm.getAttribute("method")).toBeNull();
    expect(within(searchForm).getByDisplayValue("Alex")).toBeTruthy();
    expect(within(searchForm).getByDisplayValue(branchId)).toBeTruthy();
  });

  it("applies a changed branch while preserving search and resetting the page", async () => {
    const user = userEvent.setup();
    renderDirectory({ staff: { ...staffPage, page: 2 } });

    await user.click(screen.getByRole("combobox", { name: "Branch scope" }));
    await user.click(screen.getByRole("option", { name: "Manila South" }));

    const branchForm = screen.getByRole("form", {
      name: "Filter staff by branch",
    });
    expect(
      branchForm.querySelector<HTMLInputElement>('input[name="branch_id"]')
        ?.value,
    ).toBe(branchOptions[1].id);
    expect(within(branchForm).getByDisplayValue("Alex")).toBeTruthy();
    expect(branchForm.querySelector('[name="page"]')).toBeNull();
    expect(branchForm.getAttribute("action")).toBe("/staff");
    expect(branchForm.getAttribute("method")).toBeNull();
  });
});
