// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "./change-password-form";

const { change, replace } = vi.hoisted(() => ({
  change: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("../services/auth-actions", () => ({ changePasswordAction: change }));

function mount(required = true) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChangePasswordForm required={required} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  change.mockReset();
  replace.mockReset();
});

describe("ChangePasswordForm", () => {
  it("checks length, reuse and confirmation before submitting", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(
      screen.getByLabelText("Current password"),
      "Temp-password-1",
    );
    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "other");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByText("Use 12 to 128 characters.")).toBeTruthy();
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("New password"));
    expect(change).not.toHaveBeenCalled();
  });

  it("changes the password and returns to the app", async () => {
    const user = userEvent.setup();
    change.mockResolvedValue({ ok: true, data: {} });
    mount(false);
    await user.type(
      screen.getByLabelText("Current password"),
      "Temp-password-1",
    );
    await user.type(
      screen.getByLabelText("New password"),
      "a-much-longer-password",
    );
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "a-much-longer-password",
    );
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(change).toHaveBeenCalledWith({
      current_password: "Temp-password-1",
      new_password: "a-much-longer-password",
    });
  });

  it("keeps the form and shows the API error", async () => {
    const user = userEvent.setup();
    change.mockResolvedValue({
      ok: false,
      status: 400,
      message: "The current password is incorrect",
    });
    mount();
    await user.type(screen.getByLabelText("Current password"), "wrong-one-xx");
    await user.type(
      screen.getByLabelText("New password"),
      "a-much-longer-password",
    );
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "a-much-longer-password",
    );
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/incorrect/);
    expect(screen.getByLabelText("New password")).toHaveProperty(
      "value",
      "a-much-longer-password",
    );
  });
});
