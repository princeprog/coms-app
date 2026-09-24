// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RolesManagement } from "./roles-management";

// Base UI uses PointerEvent while jsdom currently exposes only MouseEvent.
if (!window.PointerEvent) {
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: window.MouseEvent,
  });
}
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
    id: "2",
    code: "SUPER_ADMIN",
    role_name: "Super Admin",
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

    expect(screen.getByText("Global access")).toBeTruthy();
    expect(screen.getByText("No permissions")).toBeTruthy();
    expect(screen.getAllByText("System role")).toHaveLength(2);
    expect(screen.queryByLabelText("Role name for No access")).toBeNull();
    expect(screen.queryByLabelText("Role name for Stock Manager")).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeTruthy();
  });

  it("creates a role with only the selected catalog permissions", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoleAction).mockResolvedValue({ ok: true });
    renderRoles();

    await user.click(screen.getByRole("button", { name: "Create role" }));
    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.type(screen.getByLabelText("Role name"), "Receiving Clerk");
    await user.click(screen.getByText("read", { selector: "label" }));
    expect(
      screen
        .getByRole("checkbox", { name: /New role inventory\.read/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
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

    await user.click(screen.getByRole("button", { name: "Create role" }));
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

  it("announces successful name and permission saves independently", async () => {
    const user = userEvent.setup();
    vi.mocked(updateRoleNameAction).mockResolvedValue({ ok: true });
    vi.mocked(replaceRolePermissionsAction).mockResolvedValue({ ok: true });
    renderRoles();

    await user.click(
      screen.getByRole("button", { name: "Manage Stock Manager" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Role name" }));
    await user.type(
      screen.getByRole("textbox", { name: "Role name" }),
      "Senior Stock Manager",
    );
    await user.click(screen.getByRole("button", { name: "Save role name" }));
    expect((await screen.findByRole("status")).textContent).toBe(
      "Role name updated.",
    );

    await user.click(
      screen.getByRole("checkbox", { name: /Stock Manager inventory\.adjust/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save permissions" }));
    const permissionStatus = await screen.findByText("Permissions updated.");
    expect(permissionStatus.getAttribute("role")).toBe("status");
  });

  it("keeps the editor open and fields disabled while a save is pending", async () => {
    const user = userEvent.setup();
    let resolveSave: ((result: { ok: true }) => void) | undefined;
    vi.mocked(updateRoleNameAction).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderRoles();

    await user.click(
      screen.getByRole("button", { name: "Manage Stock Manager" }),
    );
    const roleName = screen.getByRole("textbox", { name: "Role name" });
    await user.clear(roleName);
    await user.type(roleName, "Senior Stock Manager");
    await user.click(screen.getByRole("button", { name: "Save role name" }));

    expect((roleName as HTMLInputElement).disabled).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).toBeNull();

    resolveSave?.({ ok: true });
    expect(await screen.findByText("Role name updated.")).toBeTruthy();
    expect((roleName as HTMLInputElement).disabled).toBe(false);
  });

  it("keeps a new role draft when dismissal is canceled and discards on confirmation", async () => {
    const user = userEvent.setup();
    renderRoles();

    const trigger = screen.getByRole("button", { name: "Create role" });
    await user.click(trigger);
    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("alertdialog", {
        name: "Discard unsaved role changes?",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect((screen.getByLabelText("Role code") as HTMLInputElement).value).toBe(
      "RECEIVING_CLERK",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("hides mutations that the current operator cannot perform", () => {
    renderRoles({
      canCreateRole: false,
      canUpdateRole: false,
      canUpdatePermissions: false,
      canDeactivateRole: false,
    });

    expect(screen.queryByRole("button", { name: "Create role" })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();
    expect(
      screen.getByRole("button", { name: "View Stock Manager" }),
    ).toBeTruthy();
  });

  it("uses an accessible confirmation dialog and restores focus when canceled", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps grants selected when a module is searched out and restored", async () => {
    const user = userEvent.setup();
    renderRoles();
    await user.click(
      screen.getByRole("button", { name: "Manage Stock Manager" }),
    );

    expect(screen.getByRole("dialog").textContent).toContain(
      "View stock balances",
    );
    const inventoryRead = await screen.findByRole("checkbox", {
      name: /Stock Manager inventory\.read/,
    });
    expect(inventoryRead.getAttribute("aria-checked")).toBe("true");
    await user.type(screen.getByLabelText("Search permissions"), "missing");
    expect(
      screen.queryByRole("checkbox", { name: /Stock Manager inventory\.read/ }),
    ).toBeNull();
    await user.clear(screen.getByLabelText("Search permissions"));
    expect(
      (
        await screen.findByRole("checkbox", {
          name: /Stock Manager inventory\.read/,
        })
      ).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("asks before discarding permission edits and restores focus to the role", async () => {
    const user = userEvent.setup();
    renderRoles();

    const trigger = screen.getByRole("button", {
      name: "Manage Stock Manager",
    });
    await user.click(trigger);
    const inventoryAdjust = await screen.findByRole("checkbox", {
      name: /Stock Manager inventory\.adjust/,
    });
    await user.click(inventoryAdjust);
    await user.click(screen.getByRole("button", { name: "Close editor" }));

    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(inventoryAdjust.getAttribute("aria-checked")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Close editor" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
