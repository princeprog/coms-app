// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleCreatePage } from "./role-create-page";
import { createRoleAction } from "../services/role-actions";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

vi.mock("../services/role-actions", () => ({
  createRoleAction: vi.fn(),
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

describe("role create page", () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(createRoleAction).mockReset();
  });

  it("creates a role with its selected permissions and returns to the directory", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoleAction).mockResolvedValue({ ok: true });
    render(<RoleCreatePage permissions={permissions} />);

    expect(screen.getByRole("heading", { name: "Role details" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Permissions" })).toBeTruthy();
    await user.type(screen.getByLabelText("Role name"), "Receiving Clerk");
    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.click(
      screen.getByRole("checkbox", { name: /New role inventory\.read/ }),
    );
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect(createRoleAction).toHaveBeenCalledWith({
      code: "RECEIVING_CLERK",
      role_name: "Receiving Clerk",
      permission_keys: ["inventory.read"],
    });
    expect(push).toHaveBeenCalledWith("/roles");
  });

  it("keeps values after a server error and confirms before leaving a dirty draft", async () => {
    const user = userEvent.setup();
    vi.mocked(createRoleAction).mockResolvedValue({
      ok: false,
      error: "Role code already exists.",
    });
    render(<RoleCreatePage permissions={permissions} />);
    const name = screen.getByLabelText("Role name");
    await user.type(name, "Receiving Clerk");
    await user.type(screen.getByLabelText("Role code"), "RECEIVING_CLERK");
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Role code already exists.",
    );
    expect((name as HTMLInputElement).value).toBe("Receiving Clerk");
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", {
        name: "Discard unsaved role changes?",
      }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    await user.click(
      await screen.findByRole("link", { name: "Back to roles" }),
    );
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect((name as HTMLInputElement).value).toBe("Receiving Clerk");

    await user.click(
      await screen.findByRole("link", { name: "Back to roles" }),
    );
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(push).toHaveBeenCalledWith("/roles");
  });
});
