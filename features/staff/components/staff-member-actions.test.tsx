// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffMemberActions } from "@/features/staff/components/staff-member-actions";
import {
  assignStaffBranchesAction,
  assignStaffRoleAction,
  deactivateStaffAction,
  updateStaffAction,
} from "@/features/staff/services/staff-actions";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock("@/features/staff/services/staff-actions", () => ({
  assignStaffBranchesAction: vi.fn(),
  assignStaffRoleAction: vi.fn(),
  deactivateStaffAction: vi.fn(),
  updateStaffAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const staffId = "4b450453-7640-4719-990c-29e97b77e3e9";
const northBranch = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const southBranch = "28af8c76-1e33-4745-a03c-7f7fa2db640a";
const staff = {
  id: staffId,
  email: "alex@example.com",
  full_name: "Alex Staff",
  contact_number: "09170000000",
  is_active: true,
  role_id: "4",
  role_code: "BRANCH_MANAGER",
  role_name: "Branch Manager",
  branch_ids: [northBranch],
};
const roles = [
  {
    id: "4",
    code: "BRANCH_MANAGER",
    role_name: "Branch Manager",
    is_system: false,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "6",
    code: "CASHIER",
    role_name: "Cashier",
    is_system: false,
    is_active: true,
    permission_keys: [],
  },
];
const branchOptions = [
  { id: northBranch, name: "Manila North" },
  { id: southBranch, name: "Manila South" },
];
const allPermissions = {
  canUpdate: true,
  canAssignRole: true,
  canAssignBranches: true,
  canDeactivate: true,
  canReadRoles: true,
  canReadBranches: true,
};

function renderActions(
  overrides: Partial<Parameters<typeof StaffMemberActions>[0]> = {},
) {
  return render(
    <StaffMemberActions
      staff={staff}
      branches={branchOptions}
      roles={roles}
      rolesFailed={false}
      branchId={northBranch}
      currentUserId="not-the-current-user"
      isSuperAdmin={false}
      permissions={allPermissions}
      {...overrides}
    />,
  );
}

describe("staff member actions", () => {
  beforeEach(() => {
    vi.mocked(assignStaffBranchesAction).mockReset();
    vi.mocked(assignStaffRoleAction).mockReset();
    vi.mocked(deactivateStaffAction).mockReset();
    vi.mocked(updateStaffAction).mockReset();
    refreshMock.mockReset();
  });

  it("updates profile fields with the selected branch context", async () => {
    const user = userEvent.setup();
    vi.mocked(updateStaffAction).mockResolvedValue({ ok: true });
    renderActions();

    await user.click(screen.getByText("Edit profile"));
    await user.clear(screen.getByLabelText("Full name for Alex Staff"));
    await user.type(
      screen.getByLabelText("Full name for Alex Staff"),
      "Alex Updated",
    );
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(updateStaffAction).toHaveBeenCalledWith(staffId, northBranch, {
      full_name: "Alex Updated",
      email: "alex@example.com",
      contact_number: "09170000000",
    });
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("assigns an active role without offering the bootstrap-only role", async () => {
    const user = userEvent.setup();
    vi.mocked(assignStaffRoleAction).mockResolvedValue({ ok: true });
    renderActions();

    await user.click(screen.getByText("Assign role", { selector: "summary" }));
    const roleSelect = screen.getByLabelText("Staff role for Alex Staff");
    expect(screen.queryByRole("option", { name: "Super Admin" })).toBeNull();
    await user.selectOptions(roleSelect, "6");
    await user.click(screen.getByRole("button", { name: "Assign role" }));

    expect(assignStaffRoleAction).toHaveBeenCalledWith(staffId, northBranch, {
      role_id: "6",
    });
  });

  it("requires a deliberate choice when the current Super Admin role is not assignable", async () => {
    const user = userEvent.setup();
    const superAdminRole = {
      id: "2",
      code: "SUPER_ADMIN",
      role_name: "Super Admin",
      is_system: true,
      is_active: true,
      permission_keys: [],
    };
    renderActions({
      staff: {
        ...staff,
        role_id: "2",
        role_code: "SUPER_ADMIN",
        role_name: "Super Admin",
      },
      roles: [...roles, superAdminRole],
      isSuperAdmin: true,
    });

    await user.click(screen.getByText("Assign role", { selector: "summary" }));

    expect(screen.getByLabelText("Staff role for Alex Staff")).toHaveProperty(
      "value",
      "",
    );
    expect(screen.queryByRole("option", { name: "Super Admin" })).toBeNull();
    expect(screen.getByRole("button", { name: "Assign role" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("saves branch assignments with the selected branch context", async () => {
    const user = userEvent.setup();
    vi.mocked(assignStaffBranchesAction).mockResolvedValue({ ok: true });
    renderActions();

    await user.click(screen.getByText("Manage branch assignments"));
    await user.click(screen.getByLabelText("Manila South"));
    await user.click(
      screen.getByRole("button", { name: "Save branch assignments" }),
    );

    expect(assignStaffBranchesAction).toHaveBeenCalledWith(
      staffId,
      northBranch,
      {
        branch_ids: [northBranch, southBranch],
      },
    );
  });

  it("requires keyboard-accessible confirmation before deactivation", async () => {
    const user = userEvent.setup();
    vi.mocked(deactivateStaffAction).mockResolvedValue({ ok: true });
    renderActions();

    const trigger = screen.getByRole("button", { name: "Deactivate staff" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("alertdialog", { name: /deactivate alex staff/i }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Confirm deactivation" }),
    );

    expect(deactivateStaffAction).toHaveBeenCalledWith(staffId, northBranch);
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("hides role, branch, and deactivation controls on one's own account", () => {
    renderActions({ currentUserId: staffId });

    expect(screen.queryByText("Assign role")).toBeNull();
    expect(screen.queryByText("Manage branch assignments")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Deactivate staff" }),
    ).toBeNull();
  });

  it("protects Super Admin targets from ordinary role, branch, and status changes", () => {
    renderActions({
      staff: { ...staff, role_code: "SUPER_ADMIN", role_name: "Super Admin" },
    });

    expect(screen.queryByText("Assign role")).toBeNull();
    expect(screen.queryByText("Manage branch assignments")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Deactivate staff" }),
    ).toBeNull();
  });
});
