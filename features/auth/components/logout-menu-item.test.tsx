// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { mutateMock, useLogoutMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  useLogoutMock: vi.fn(),
}));
vi.mock("@/features/auth/hooks/mutations/use-logout", () => ({
  useLogout: useLogoutMock,
}));
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutMenuItem } from "./logout-menu-item";
// JSDOM 26 lacks PointerEvent, which Base UI uses for keyboard-generated clicks.
window.PointerEvent ??= MouseEvent as typeof PointerEvent;
function AccountMenu() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
      <DropdownMenuContent>
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
describe("real Base UI logout menu", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useLogoutMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      error: null,
    });
  });
  it("activates by mouse and leaves the menu open", async () => {
    render(<AccountMenu />);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Log out" }),
    );
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menu")).toBeTruthy();
  });
  it.each(["{Enter}", " "])("activates by keyboard %s", async (key) => {
    render(<AccountMenu />);
    const item = await screen.findByRole("menuitem", { name: "Log out" });
    act(() => item.focus());
    await userEvent.keyboard(key);
    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menu")).toBeTruthy();
  });
  it("disables pending activation and announces failure with working retry", async () => {
    useLogoutMock.mockReturnValue({
      mutate: mutateMock,
      isPending: true,
      error: null,
    });
    const view = render(<AccountMenu />);
    const pending = await screen.findByRole("menuitem", {
      name: "Signing out…",
    });
    expect(pending.getAttribute("aria-disabled")).toBe("true");
    act(() => pending.focus());
    await userEvent.keyboard("{Enter}");
    expect(mutateMock).not.toHaveBeenCalled();
    useLogoutMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
      error: new Error("offline"),
    });
    view.rerender(<AccountMenu />);
    expect(screen.getByRole("alert").textContent).toBe(
      "Sign out failed. Try again.",
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Sign out failed. Try again." }),
    );
    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
  });
});
