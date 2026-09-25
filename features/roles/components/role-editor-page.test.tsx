// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
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

// Base UI schedules ScrollArea measurements outside React's test act cycle in
// jsdom. The production browser suite verifies the actual scroll behavior.
vi.mock("@/components/ui/scroll-area", async () => {
  const { createElement } = await import("react");
  return {
    ScrollArea: ({ children, ...props }: ComponentProps<"div">) =>
      createElement("div", props, children),
  };
});

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

  it("matches the create workspace with editable name and read-only role code", () => {
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit role" })).toBeTruthy();
    expect(
      screen.getByText("Define a role and choose its permissions."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to roles" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Role name" })).toBeTruthy();
    const code = screen.getByRole("textbox", { name: "Role code" });
    expect((code as HTMLInputElement).value).toBe("STOCK_MANAGER");
    expect((code as HTMLInputElement).readOnly).toBe(true);
    expect(
      screen.getByRole("searchbox", { name: "Search permissions" }).id,
    ).toBe("role-3-permission-search");
    expect(screen.getByText("1 permission selected")).toBeTruthy();
    expect(
      screen.getByText("1 permission selected").parentElement?.className,
    ).toContain("min-[360px]:flex");
    expect(screen.getByRole("button", { name: "Save role name" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Save permissions" }),
    ).toBeTruthy();
  });

  it("places each independent save action in the shared footer", () => {
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    const nameSave = screen.getByRole("button", { name: "Save role name" });
    const permissionsSave = screen.getByRole("button", {
      name: "Save permissions",
    });
    const footer = nameSave.closest("footer");
    expect(footer).toBeTruthy();
    expect(permissionsSave.closest("footer")).toBe(footer);
    expect(nameSave.getAttribute("form")).toBe("role-name-form-3");
    expect(permissionsSave.getAttribute("form")).toBe(
      "role-permissions-form-3",
    );
  });

  it("shows the permission save only when name editing is unavailable", () => {
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole={false}
        canUpdatePermissions
      />,
    );

    expect(screen.getByRole("heading", { name: "Edit role" })).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "Role name" }) as HTMLInputElement)
        .readOnly,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Save role name" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Save permissions" }),
    ).toBeTruthy();
  });

  it("uses the primary action for a name-only editor", () => {
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions={false}
      />,
    );

    const nameSave = screen.getByRole("button", { name: "Save role name" });
    expect(nameSave.className).toContain("bg-primary");
    expect(
      screen.queryByRole("button", { name: "Save permissions" }),
    ).toBeNull();
    expect(
      (
        screen.getByRole("checkbox", {
          name: /Stock Manager inventory\.adjust/,
        }) as HTMLButtonElement
      ).getAttribute("data-disabled"),
    ).not.toBeNull();
  });

  it("blocks the other save while a permission update is pending", async () => {
    const user = userEvent.setup();
    let finishSave!: (result: { ok: true }) => void;
    vi.mocked(replaceRolePermissionsAction).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: /Stock Manager inventory\.adjust/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save permissions" }));

    expect(
      (
        screen.getByRole("button", {
          name: "Saving permissions…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Save role name",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("textbox", { name: "Role name" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);

    finishSave({ ok: true });
    expect(await screen.findByText("Permissions updated.")).toBeTruthy();
  });

  it("confirms before discarding an unsaved role name", async () => {
    const user = userEvent.setup();
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );
    const name = screen.getByRole("textbox", { name: "Role name" });
    await user.clear(name);
    await user.type(name, "Unsaved role name");
    await user.click(screen.getByRole("link", { name: "Back to roles" }));

    const confirmation = screen.getByRole("alertdialog", {
      name: "Discard unsaved role changes?",
    });
    expect(confirmation).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect((name as HTMLInputElement).value).toBe("Unsaved role name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(push).toHaveBeenCalledWith("/roles");
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
    expect(screen.getByText("2 permissions selected")).toBeTruthy();
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

    expect(screen.getByRole("heading", { name: "View role" })).toBeTruthy();
    expect(
      screen.getByText(
        "This protected system role has global access across COMS.",
      ),
    ).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "Role name" }) as HTMLInputElement)
        .readOnly,
    ).toBe(true);
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

    expect(screen.getByText("Inactive roles cannot be edited.")).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "Role name" }) as HTMLInputElement)
        .readOnly,
    ).toBe(true);
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

  it("allows saving an empty permission set", async () => {
    const user = userEvent.setup();
    vi.mocked(replaceRolePermissionsAction).mockResolvedValue({ ok: true });
    render(
      <RoleEditorPage
        role={stockManager}
        permissions={permissions}
        canUpdateRole
        canUpdatePermissions
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /Stock Manager inventory\.read/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save permissions" }));

    expect(replaceRolePermissionsAction).toHaveBeenCalledWith("3", {
      permission_keys: [],
    });
    expect(await screen.findByText("0 permissions selected")).toBeTruthy();
  });
});
