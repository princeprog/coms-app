// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffRoleForm } from "@/features/staff/components/staff-role-form";
import { assignStaffRoleAction } from "@/features/staff/services/staff-actions";

vi.mock("@/features/staff/services/staff-actions", () => ({
  assignStaffRoleAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const staff = {
  id: "4b450453-7640-4719-990c-29e97b77e3e9",
  email: "alex@example.com",
  full_name: "Alex Staff",
  contact_number: "09170000000",
  is_active: true,
  role_id: "4",
  role_code: "BRANCH_MANAGER",
  role_name: "Branch Manager",
  branch_ids: [],
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
];

describe("staff role assignment", () => {
  beforeEach(() => vi.mocked(assignStaffRoleAction).mockReset());

  it("can remove an assigned role and leave the account with no access", async () => {
    const user = userEvent.setup();
    vi.mocked(assignStaffRoleAction).mockResolvedValue({ ok: true });
    render(<StaffRoleForm staff={staff} roles={roles} rolesFailed={false} />);

    await user.click(screen.getByText("Assign role", { selector: "summary" }));
    await user.click(
      screen.getByRole("combobox", { name: "Staff role for Alex Staff" }),
    );
    await user.click(screen.getByRole("option", { name: "Unassigned" }));
    await user.click(screen.getByRole("button", { name: "Remove role" }));

    expect(assignStaffRoleAction).toHaveBeenCalledWith(staff.id, undefined, {
      role_id: null,
    });
  });
});
