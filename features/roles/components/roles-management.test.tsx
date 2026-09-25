// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RolesManagement } from "./roles-management";
import { deactivateRoleAction } from "../services/role-actions";

if (!window.PointerEvent) {
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: window.MouseEvent,
  });
}

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("../services/role-actions", () => ({
  deactivateRoleAction: vi.fn(),
}));

const roles = [
  {
    id: "1",
    code: "EMPTY_ROLE",
    role_name: "Empty role",
    is_system: false,
    is_predefined: false,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "2",
    code: "SUPER_ADMIN",
    role_name: "Super Admin",
    is_system: true,
    is_predefined: false,
    is_active: true,
    permission_keys: [],
  },
  {
    id: "3",
    code: "STOCK_MANAGER",
    role_name: "Stock Manager",
    is_system: false,
    is_predefined: false,
    is_active: true,
    permission_keys: ["inventory.read"],
  },
  {
    id: "4",
    code: "BRANCH_MANAGER",
    role_name: "Branch Manager",
    is_system: false,
    is_predefined: true,
    is_active: true,
    permission_keys: ["stock_requests.read"],
  },
];

function renderRoles(
  overrides: Partial<ComponentProps<typeof RolesManagement>> = {},
) {
  return render(
    <RolesManagement
      roles={roles}
      canCreateRole
      canUpdateRole
      canUpdatePermissions
      canDeactivateRole
      {...overrides}
    />,
  );
}

describe("roles directory", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.mocked(deactivateRoleAction).mockReset();
  });

  it("shows role names as plain text and preserves the access summaries", () => {
    renderRoles();

    const directory = screen.getByRole("table", {
      name: "Roles and their access summary",
    });
    for (const role of roles) {
      const row = within(directory).getByRole("row", {
        name: new RegExp(role.role_name, "i"),
      });
      expect(within(row).queryByRole("link")).toBeNull();
      expect(within(row).getByText(role.role_name)).toBeTruthy();
      expect(within(row).queryByText(role.code)).toBeNull();
    }
    expect(screen.getByText("Global access")).toBeTruthy();
    expect(screen.getByText("No permissions")).toBeTruthy();
    expect(screen.getByText("Predefined")).toBeTruthy();
  });

  it("navigates to manage and view pages from the row action menu", async () => {
    const user = userEvent.setup();
    renderRoles();

    const manageTrigger = screen.getByRole("button", {
      name: "More actions for Stock Manager",
    });
    manageTrigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen
        .getByRole("menuitem", { name: "Manage role" })
        .getAttribute("href"),
    ).toBe("/roles/3");
    await user.keyboard("{Escape}");

    const viewTrigger = screen.getByRole("button", {
      name: "More actions for Super Admin",
    });
    viewTrigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("menuitem", { name: "View role" }).getAttribute("href"),
    ).toBe("/roles/2");
  });

  it("shows a scannable directory without exposing role codes", () => {
    renderRoles();

    const directory = screen.getByRole("table", {
      name: "Roles and their access summary",
    });
    expect(screen.getByRole("region", { name: "Role table" }).tabIndex).toBe(0);
    expect(
      screen.getByRole("heading", { name: "Role directory" }),
    ).toBeTruthy();
    expect(within(directory).getAllByRole("row")).toHaveLength(
      roles.length + 1,
    );
    expect(within(directory).getByText("Super Admin")).toBeTruthy();
    expect(within(directory).getByText("Branch Manager")).toBeTruthy();
    for (const role of roles) {
      expect(within(directory).queryByText(role.code)).toBeNull();
    }
  });

  it("links Create role to its page and keeps view available without edit grants", () => {
    renderRoles({
      canCreateRole: false,
      canUpdateRole: false,
      canUpdatePermissions: false,
      canDeactivateRole: false,
    });

    expect(screen.queryByRole("link", { name: "Create role" })).toBeNull();
    const stockRow = screen.getByRole("row", { name: /Stock Manager/ });
    expect(within(stockRow).queryByRole("link")).toBeNull();
    expect(
      screen.getByRole("button", { name: "More actions for Stock Manager" }),
    ).toBeTruthy();
  });

  it("keeps deactivation behind confirmation and refreshes after success", async () => {
    const user = userEvent.setup();
    vi.mocked(deactivateRoleAction).mockResolvedValue({ ok: true });
    renderRoles();

    const trigger = screen.getByRole("button", {
      name: "More actions for Stock Manager",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Deactivate role" }));
    expect(
      screen.getByRole("alertdialog", { name: /deactivate stock manager/i }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Confirm deactivation" }),
    );

    expect(deactivateRoleAction).toHaveBeenCalledWith("3");
    expect(refresh).toHaveBeenCalled();
  });
});
