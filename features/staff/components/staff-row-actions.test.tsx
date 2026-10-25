// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { toast } from "@/components/ui/toast";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffRowActions } from "@/features/staff/components/staff-row-actions";
import {
  assignStaffBranchesAction,
  assignStaffRoleAction,
  deactivateStaffAction,
  updateStaffAction,
} from "@/features/staff/services/staff-actions";

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock("@/features/staff/services/staff-actions", () => ({
  assignStaffBranchesAction: vi.fn(),
  assignStaffRoleAction: vi.fn(),
  deactivateStaffAction: vi.fn(),
  updateStaffAction: vi.fn(),
  resetStaffPasswordAction: vi.fn(),
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
    is_predefined: true,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "6",
    code: "CASHIER",
    role_name: "Cashier",
    is_system: false,
    is_predefined: true,
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
  canResetPassword: true,
  canReadRoles: true,
  canReadBranches: true,
};

function renderActions(
  overrides: Partial<Parameters<typeof StaffRowActions>[0]> = {},
) {
  return render(
    <StaffRowActions
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

async function openAction(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(
    screen.getByRole("button", { name: "Actions for Alex Staff" }),
  );
  await user.click(await screen.findByRole("menuitem", { name }));
}
describe("staff row actions", () => {
  it("hides password reset and deactivation for inactive staff", async () => {
    renderActions({ staff: { ...staff, is_active: false } });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Actions for Alex Staff" }));
    expect(
      (await screen.findAllByRole("menuitem")).map((item) => item.textContent),
    ).toEqual(["Edit profile", "Assign role", "Manage branch assignments"]);
  });

  it("allows a password-reset-only operator to open the confirmation", async () => {
    renderActions({
      permissions: {
        ...allPermissions,
        canUpdate: false,
        canAssignRole: false,
        canAssignBranches: false,
        canDeactivate: false,
      },
    });
    await openAction(userEvent.setup(), "Reset password");
    expect(
      screen.getByRole("alertdialog", { name: /reset alex staff/i }),
    ).toBeTruthy();
  });

  it("blocks closing during deactivation and preserves a server error for retry", async () => {
    let finish!: (value: { ok: false; error: string }) => void;
    vi.mocked(deactivateStaffAction).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    renderActions();
    await openAction(user, "Deactivate staff");
    await user.click(
      screen.getByRole("button", { name: "Confirm deactivation" }),
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
      "disabled",
      true,
    );
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await act(async () =>
      finish({ ok: false, error: "This account cannot be deactivated." }),
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "This account cannot be deactivated.",
    );
    expect(toast.add).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    vi.mocked(assignStaffBranchesAction).mockReset();
    vi.mocked(assignStaffRoleAction).mockReset();
    vi.mocked(deactivateStaffAction).mockReset();
    vi.mocked(updateStaffAction).mockReset();
    refreshMock.mockReset();
    vi.mocked(toast.add).mockClear();
  });

  it("offers exactly five focused actions without Manage staff", async () => {
    renderActions();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Actions for Alex Staff" }));
    expect(
      (await screen.findAllByRole("menuitem")).map((item) => item.textContent),
    ).toEqual([
      "Edit profile",
      "Assign role",
      "Manage branch assignments",
      "Reset password",
      "Deactivate staff",
    ]);
  });

  it("updates profile fields with the selected branch context", async () => {
    const user = userEvent.setup();
    vi.mocked(updateStaffAction).mockResolvedValue({ ok: true });
    renderActions();

    await openAction(user, "Edit profile");
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
    expect(toast.add).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Staff profile updated.",
    });
  });

  it("assigns an active role without offering the bootstrap-only role", async () => {
    const user = userEvent.setup();
    vi.mocked(assignStaffRoleAction).mockResolvedValue({ ok: true });
    renderActions();

    await openAction(user, "Assign role");
    const roleSelect = screen.getByRole("combobox", {
      name: "Staff role for Alex Staff",
    });
    await user.click(roleSelect);
    expect(screen.queryByRole("option", { name: "Super Admin" })).toBeNull();
    await user.click(await screen.findByRole("option", { name: "Cashier" }));
    await user.click(screen.getByRole("button", { name: "Assign role" }));

    expect(assignStaffRoleAction).toHaveBeenCalledWith(staffId, northBranch, {
      role_id: "6",
    });
    expect(toast.add).toHaveBeenCalledWith({
      type: "success",
      title: "Staff role updated.",
    });
  });

  it("requires a deliberate choice when the current Super Admin role is not assignable", async () => {
    const user = userEvent.setup();
    const superAdminRole = {
      id: "2",
      code: "SUPER_ADMIN",
      role_name: "Super Admin",
      is_system: true,
      is_predefined: false,
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

    await openAction(user, "Assign role");
    const roleSelect = screen.getByRole("combobox", {
      name: "Staff role for Alex Staff",
    });

    expect(roleSelect.textContent).toContain("Select a role");
    await user.click(roleSelect);
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

    await openAction(user, "Manage branch assignments");
    await user.click(screen.getByRole("checkbox", { name: "Manila South" }));
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
    expect(toast.add).toHaveBeenCalledExactlyOnceWith({
      type: "success",
      title: "Branch access updated.",
    });
  });

  it("requires keyboard-accessible confirmation before deactivation", async () => {
    const user = userEvent.setup();
    vi.mocked(deactivateStaffAction).mockResolvedValue({ ok: true });
    renderActions();

    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    const trigger = await screen.findByRole("menuitem", {
      name: "Deactivate staff",
    });
    act(() => trigger.focus());
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("alertdialog", { name: /deactivate alex staff/i }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Confirm deactivation" }),
    );

    expect(deactivateStaffAction).toHaveBeenCalledWith(staffId, northBranch);
    expect(toast.add).toHaveBeenCalledWith({
      type: "success",
      title: "Staff account deactivated.",
    });
  });

  it("hides role, branch, and deactivation controls on one's own account", async () => {
    renderActions({ currentUserId: staffId });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Actions for Alex Staff" }));

    expect(screen.queryByText("Assign role")).toBeNull();
    expect(screen.queryByText("Manage branch assignments")).toBeNull();
    expect(
      screen.queryByRole("menuitem", { name: "Deactivate staff" }),
    ).toBeNull();
  });

  it("protects Super Admin targets from ordinary role, branch, and status changes", async () => {
    renderActions({
      staff: { ...staff, role_code: "SUPER_ADMIN", role_name: "Super Admin" },
    });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Actions for Alex Staff" }));

    expect(screen.queryByText("Assign role")).toBeNull();
    expect(screen.queryByText("Manage branch assignments")).toBeNull();
    expect(
      screen.queryByRole("menuitem", { name: "Deactivate staff" }),
    ).toBeNull();
  });
});
