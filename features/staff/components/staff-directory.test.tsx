// @vitest-environment jsdom
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { updateStaffAction } from "@/features/staff/services/staff-actions";
import { toast } from "@/components/ui/toast";
import { StaffDirectory } from "@/features/staff/components/staff-directory";

vi.mock("@/features/staff/services/staff-actions", () => ({
  createStaffAction: vi.fn(),
  updateStaffAction: vi.fn(),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
const replace = vi.hoisted(() => vi.fn());
beforeEach(() => replace.mockClear());
afterEach(() => vi.useRealTimers());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace }),
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
  it("blocks dismissal during a save and keeps a failed draft without success feedback", async () => {
    const user = userEvent.setup();
    let finish!: (result: { ok: false; error: string }) => void;
    vi.mocked(toast.add).mockClear();
    vi.mocked(updateStaffAction).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderDirectory({ managementPermissions: allManagementPermissions });
    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Manage staff" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Alex Staff" });
    const name = within(dialog).getByLabelText("Full name for Alex Staff");
    await user.clear(name);
    await user.type(name, "Alex Draft");
    await user.click(
      within(dialog).getByRole("button", { name: "Save profile" }),
    );
    expect(
      within(dialog).getByRole("button", { name: "Close staff details" }),
    ).toHaveProperty("disabled", true);
    expect(within(dialog).getByRole("button", { name: "Done" })).toHaveProperty(
      "disabled",
      true,
    );
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Alex Staff" })).toBeTruthy();
    await act(async () =>
      finish({ ok: false, error: "Email is already in use." }),
    );
    expect(within(dialog).getByRole("alert").textContent).toBe(
      "Email is already in use.",
    );
    expect(name).toHaveProperty("value", "Alex Draft");
    expect(toast.add).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("alertdialog", {
        name: /discard unsaved staff changes/i,
      }),
    ).toBeTruthy();
  });

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

  it("opens full staff details in a modal for a read-only operator", async () => {
    const user = userEvent.setup();
    renderDirectory();

    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "View details" }),
    );

    const modal = screen.getByRole("dialog", { name: "Alex Staff" });
    expect(modal.getAttribute("data-slot")).toBe("dialog-content");
    expect(within(modal).getByText("09170000000")).toBeTruthy();
    expect(within(modal).getByText("Manila North")).toBeTruthy();
    expect(
      within(modal).getByText(/do not have access to change/i),
    ).toBeTruthy();
  });

  it("opens staff creation in a centered modal", async () => {
    const user = userEvent.setup();
    renderDirectory({
      canCreateStaff: true,
      canReadRoles: true,
      roleOptions: staffRoles,
    });

    expect(screen.queryByLabelText("Email")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add staff" }));

    expect(screen.getByRole("dialog", { name: "Add staff" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create staff" })).toBeTruthy();
    expect(
      screen
        .getByRole("dialog", { name: "Add staff" })
        .getAttribute("data-slot"),
    ).toBe("dialog-content");
  });

  it("keeps a dirty management modal open until edits are discarded", async () => {
    const user = userEvent.setup();
    renderDirectory({ managementPermissions: allManagementPermissions });

    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Manage staff" }),
    );
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

    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Manage staff" }),
    );
    expect(screen.getByLabelText("Full name for Alex Staff")).toHaveProperty(
      "value",
      "Alex Staff",
    );
  });

  it("asks before closing a populated create modal and resets only after discard", async () => {
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
    expect(within(screen.getByRole("table")).getByText("Active")).toBeTruthy();
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

    expect(
      within(screen.getByRole("table")).getByText("Unassigned"),
    ).toBeTruthy();
  });

  it("preserves branch and search filters in pagination links", () => {
    renderDirectory();

    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/staff?page=2&branch_id=${branchId}&search=Alex`);
  });

  it("clears an empty search while preserving branch scope", async () => {
    const user = userEvent.setup();
    renderDirectory({ staff: { ...staffPage, items: [], total: 0 } });
    expect(screen.getByText("No staff match this search")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(replace).toHaveBeenLastCalledWith(`/staff?branch_id=${branchId}`, {
      scroll: false,
    });
  });

  it("offers all-branch filtering only to the protected Super Admin", async () => {
    const user = userEvent.setup();
    renderDirectory({ isSuperAdmin: true, selectedBranchId: undefined });

    await user.click(screen.getByRole("combobox", { name: "Branch scope" }));
    expect(screen.getByRole("option", { name: "All branches" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Manila North" })).toBeTruthy();
  });

  it("debounces search and resets pagination while preserving branch scope", () => {
    vi.useFakeTimers();
    renderDirectory({ staff: { ...staffPage, page: 2 } });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Maria" },
    });
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      `/staff?branch_id=${branchId}&search=Maria`,
      { scroll: false },
    );
  });

  it("preserves a pending search when changing branches", async () => {
    const user = userEvent.setup();
    renderDirectory({ staff: { ...staffPage, page: 2 } });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Maria" },
    });
    await user.click(screen.getByRole("combobox", { name: "Branch scope" }));
    await user.click(
      await screen.findByRole("option", { name: "Manila South" }),
    );
    expect(replace).toHaveBeenLastCalledWith(
      `/staff?branch_id=${branchOptions[1].id}&search=Maria`,
      { scroll: false },
    );
  });

  it("preserves branch and search when changing status", async () => {
    const user = userEvent.setup();
    renderDirectory({ status: "inactive" });
    expect(
      screen.getByRole("combobox", { name: "Status" }).textContent,
    ).toContain("Inactive");
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe(`/staff?page=2&branch_id=${branchId}&search=Alex&status=inactive`);
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Unassigned" }));
    expect(replace).toHaveBeenLastCalledWith(
      `/staff?branch_id=${branchId}&search=Alex&status=unassigned`,
      { scroll: false },
    );
  });

  it("opens the staff modal from a three-dot row menu", async () => {
    const user = userEvent.setup();
    renderDirectory();
    await user.click(
      screen.getByRole("button", { name: "Actions for Alex Staff" }),
    );
    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("menuitem", { name: "View details" }));
    expect(screen.getByRole("dialog", { name: "Alex Staff" })).toBeTruthy();
  });
});
