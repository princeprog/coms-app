// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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
    code: "NO_ACCESS",
    role_name: "No access",
    is_system: true,
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

  it("links role records to their dedicated pages and summarizes protected access", () => {
    renderRoles();

    expect(
      screen
        .getByRole("link", { name: "Manage Stock Manager" })
        .getAttribute("href"),
    ).toBe("/roles/3");
    expect(
      screen
        .getByRole("link", { name: "View Super Admin" })
        .getAttribute("href"),
    ).toBe("/roles/2");
    expect(screen.getByText("Global access")).toBeTruthy();
    expect(screen.getByText("No permissions")).toBeTruthy();
    expect(screen.getByText("Predefined")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Manage Branch Manager" })
        .getAttribute("href"),
    ).toBe("/roles/4");
  });

  it("links Create role to its page and keeps view available without edit grants", () => {
    renderRoles({
      canCreateRole: false,
      canUpdateRole: false,
      canUpdatePermissions: false,
      canDeactivateRole: false,
    });

    expect(screen.queryByRole("link", { name: "Create role" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "View Stock Manager" }),
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
