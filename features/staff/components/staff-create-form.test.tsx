// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffCreateForm } from "@/features/staff/components/staff-create-form";
import { createStaffAction } from "@/features/staff/services/staff-actions";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));
vi.mock("@/features/staff/services/staff-actions", () => ({
  createStaffAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const northBranch = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const southBranch = "28af8c76-1e33-4745-a03c-7f7fa2db640a";
const roles = [
  {
    id: "1",
    code: "NO_ACCESS",
    role_name: "No access",
    is_system: true,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "4",
    code: "BRANCH_MANAGER",
    role_name: "Branch Manager",
    is_system: false,
    is_active: true,
    permission_keys: ["staff.read"],
  },
  {
    id: "2",
    code: "SUPER_ADMIN",
    role_name: "Super Admin",
    is_system: true,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "5",
    code: "INACTIVE_ROLE",
    role_name: "Inactive role",
    is_system: false,
    is_active: false,
    permission_keys: [],
  },
];
const branches = [
  { id: northBranch, name: "Manila North" },
  { id: southBranch, name: "Manila South" },
];

describe("staff creation", () => {
  beforeEach(() => {
    vi.mocked(createStaffAction).mockReset();
    refreshMock.mockReset();
  });

  it("creates an account using only an assignable role and selected branches", async () => {
    const user = userEvent.setup();
    vi.mocked(createStaffAction).mockResolvedValue({ ok: true });
    render(
      <StaffCreateForm
        roles={roles}
        branches={branches}
        initialBranchId={northBranch}
      />,
    );

    expect(screen.getByLabelText("Role")).toHaveProperty("value", "1");
    expect(screen.queryByRole("option", { name: "Super Admin" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Inactive role" })).toBeNull();
    expect(screen.getByLabelText("Manila North")).toHaveProperty(
      "checked",
      true,
    );

    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Full name"), "Alex Staff");
    await user.type(screen.getByLabelText("Contact number"), "09170000000");
    await user.type(
      screen.getByLabelText("Initial password"),
      "safe staff passphrase 1",
    );
    await user.selectOptions(screen.getByLabelText("Role"), "4");
    await user.click(screen.getByLabelText("Manila South"));
    await user.click(screen.getByRole("button", { name: "Create staff" }));

    expect(createStaffAction).toHaveBeenCalledWith({
      email: "alex@example.com",
      full_name: "Alex Staff",
      contact_number: "09170000000",
      password: "safe staff passphrase 1",
      role_id: "4",
      branch_ids: [northBranch, southBranch],
    });
    expect((await screen.findByRole("status")).textContent).toBe(
      "Staff account created.",
    );
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("keeps entered values and reports a rejected create request", async () => {
    const user = userEvent.setup();
    vi.mocked(createStaffAction).mockResolvedValue({
      ok: false,
      error: "An account with that email already exists.",
    });
    render(<StaffCreateForm roles={roles} branches={branches} />);

    await user.type(screen.getByLabelText("Email"), "alex@example.com");
    await user.type(screen.getByLabelText("Full name"), "Alex Staff");
    await user.type(screen.getByLabelText("Contact number"), "09170000000");
    await user.type(
      screen.getByLabelText("Initial password"),
      "safe staff passphrase 1",
    );
    await user.click(screen.getByRole("button", { name: "Create staff" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "An account with that email already exists.",
    );
    expect(screen.getByLabelText("Email")).toHaveProperty(
      "value",
      "alex@example.com",
    );
    expect(screen.getByLabelText("Initial password")).toHaveProperty(
      "value",
      "safe staff passphrase 1",
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
