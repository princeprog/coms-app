// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RolesManagement } from "./roles-management";
import {
  createRoleAction,
  deactivateRoleAction,
  replaceRolePermissionsAction,
  updateRoleNameAction,
} from "../services/role-actions";

vi.mock("../services/role-actions", () => ({
  createRoleAction: vi.fn(),
  deactivateRoleAction: vi.fn(),
  replaceRolePermissionsAction: vi.fn(),
  updateRoleNameAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const permissions = [
  {
    key: "inventory.read",
    module_key: "inventory",
    action_key: "read",
    description: "View stock balances",
  },
  {
    key: "inventory.adjust",
    module_key: "inventory",
    action_key: "adjust",
    description: "Post an inventory adjustment",
  },
];

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
    id: "3",
    code: "STOCK_MANAGER",
    role_name: "Stock Manager",
    is_system: false,
    is_active: true,
    permission_keys: ["inventory.read"],
  },
];

function renderRoles(
  overrides: Partial<ComponentProps<typeof RolesManagement>> = {},
) {
  return render(
    <RolesManagement
      roles={roles}
      permissions={permissions}
      canCreateRole
      canUpdateRole
      canUpdatePermissions
      canDeactivateRole
      {...overrides}
    />,
  );
}

describe("roles management", () => {
  beforeEach(() => {
    vi.mocked(createRoleAction).mockReset();
    vi.mocked(deactivateRoleAction).mockReset();
    vi.mocked(replaceRolePermissionsAction).mockReset();
    vi.mocked(updateRoleNameAction).mockReset();
  });

  it("keeps system roles read-only and shows their current state", () => {
    renderRoles();

    expect(screen.getByText("No access")).toBeTruthy();
    expect(screen.getByText("System role")).toBeTruthy();
    expect(screen.queryByLabelText("Role name for No access")).toBeNull();
    expect(screen.getByLabelText("Role name for Stock Manager")).toBeTruthy();
  });

  it("creates a role with only the selected catalog permissions", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoleAction).mockResolvedValue({ ok: true });
    renderRoles();

    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.type(screen.getByLabelText("Role name"), "Receiving Clerk");
    await user.click(screen.getByLabelText("New role inventory.read"));
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect(createRoleAction).toHaveBeenCalledWith({
      code: "RECEIVING_CLERK",
      role_name: "Receiving Clerk",
      permission_keys: ["inventory.read"],
    });
  });

  it("shows a server validation error without clearing the form", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoleAction).mockResolvedValue({
      ok: false,
      error: "Role code already exists.",
    });
    renderRoles();

    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.type(screen.getByLabelText("Role name"), "Receiving Clerk");
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Role code already exists.",
    );
    expect((screen.getByLabelText("Role code") as HTMLInputElement).value).toBe(
      "RECEIVING_CLERK",
    );
  });

  it("hides mutations that the current operator cannot perform", () => {
    renderRoles({
      canCreateRole: false,
      canUpdateRole: false,
      canUpdatePermissions: false,
      canDeactivateRole: false,
    });

    expect(screen.queryByLabelText("Role code")).toBeNull();
    expect(screen.queryByLabelText("Role name for Stock Manager")).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();
  });

  it("uses an accessible confirmation dialog and restores focus when canceled", async () => {
    const user = userEvent.setup();
    renderRoles();

    const trigger = screen.getByRole("button", { name: "Deactivate role" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("alertdialog", { name: /deactivate stock manager/i }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(trigger);
  });
});
