// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleEditorPage } from "./role-editor-page";
import {
  replaceRolePermissionsAction,
  updateRoleNameAction,
} from "../services/role-actions";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("../services/role-actions", () => ({
  replaceRolePermissionsAction: vi.fn(),
  updateRoleNameAction: vi.fn(),
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

const stockManager = {
  id: "3",
  code: "STOCK_MANAGER",
  role_name: "Stock Manager",
  is_system: false,
  is_predefined: false,
  is_active: true,
  permission_keys: ["inventory.read"],
};

describe("role editor page", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.mocked(replaceRolePermissionsAction).mockReset();
    vi.mocked(updateRoleNameAction).mockReset();
  });

  it("keeps permission edits when the role name is saved independently", async () => {
    const user = userEvent.setup();
    vi.mocked(updateRoleNameAction).mockResolvedValue({ ok: true });
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    const roleName = screen.getByRole("textbox", { name: "Role name" });
    const saveName = screen.getByRole("button", { name: "Save role name" });
    const savePermissions = screen.getByRole("button", {
      name: "Save permissions",
    });
    expect((saveName as HTMLButtonElement).disabled).toBe(true);
    expect((savePermissions as HTMLButtonElement).disabled).toBe(true);
    await user.clear(roleName);
    await user.type(roleName, "Senior Stock Manager");
    const adjust = screen.getByRole("checkbox", {
      name: /Stock Manager inventory\.adjust/,
    });
    await user.click(adjust);
    expect(screen.getByText("2 selected")).toBeTruthy();
    await user.click(saveName);

    expect(await screen.findByText("Role name updated.")).toBeTruthy();
    expect(adjust.getAttribute("aria-checked")).toBe("true");
    expect((savePermissions as HTMLButtonElement).disabled).toBe(false);
    await user.clear(roleName);
    await user.type(roleName, "Chief Stock Manager");
    vi.mocked(replaceRolePermissionsAction).mockResolvedValue({ ok: true });
    await user.click(savePermissions);
    expect(await screen.findByText("Permissions updated.")).toBeTruthy();
    expect((roleName as HTMLInputElement).value).toBe("Chief Stock Manager");
    expect((saveName as HTMLButtonElement).disabled).toBe(false);
    expect(refresh).toHaveBeenCalled();
  });

  it("shows system-role grants as grouped read-only permissions", async () => {
    const user = userEvent.setup();
    render(
      <RoleEditorPage
        role={{
          ...stockManager,
          id: "2",
          code: "SUPER_ADMIN",
          role_name: "Super Admin",
          is_system: true,
          is_predefined: false,
          permission_keys: [],
        }}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    expect(screen.getByRole("heading", { name: "Super Admin" })).toBeTruthy();
    expect(screen.getByText("Global access across COMS.")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Role name" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Save permissions" }),
    ).toBeNull();
    const readPermission = screen.getByRole("checkbox", {
      name: /Super Admin inventory\.read/,
    });
    await user.click(readPermission);
    expect(readPermission.getAttribute("aria-checked")).toBe("false");
  });

  it("shows predefined roles as editable and explains their shared effect", () => {
    render(
      <RoleEditorPage
        role={{
          ...stockManager,
          id: "4",
          code: "BRANCH_MANAGER",
          role_name: "Branch Manager",
          is_predefined: true,
        }}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    expect(screen.getByText("Predefined")).toBeTruthy();
    expect(
      screen.getByText(
        "Permission changes apply to everyone assigned to this role.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Role name" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Save permissions" }),
    ).toBeTruthy();
  });

  it("keeps inactive custom roles read-only even when the operator can edit", () => {
    render(
      <RoleEditorPage
        role={{ ...stockManager, is_active: false }}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    expect(screen.getAllByText("This role is inactive.").length).toBe(2);
    expect(screen.queryByRole("textbox", { name: "Role name" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Save permissions" }),
    ).toBeNull();
  });

  it("retains failed permission edits for correction and retry", async () => {
    const user = userEvent.setup();
    vi.mocked(replaceRolePermissionsAction).mockResolvedValue({
      ok: false,
      error: "Permission update failed.",
    });
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    const adjust = screen.getByRole("checkbox", {
      name: /Stock Manager inventory\.adjust/,
    });
    await user.click(adjust);
    await user.click(screen.getByRole("button", { name: "Save permissions" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Permission update failed.",
    );
    expect(adjust.getAttribute("aria-checked")).toBe("true");
    expect(
      (
        screen.getByRole("button", {
          name: "Save permissions",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
