// @vitest-environment jsdom
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffDefaultPasswordDialog } from "./staff-default-password-dialog";
import { setStaffDefaultPasswordAction } from "../services/staff-actions";
import { toast } from "@/components/ui/toast";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../services/staff-actions", () => ({
  setStaffDefaultPasswordAction: vi.fn(),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

async function open() {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <StaffDefaultPasswordDialog configured={false} />
    </QueryClientProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Default password" }));
  return user;
}

describe("default staff password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires matching confirmation before saving", async () => {
    const user = await open();
    await user.type(screen.getByLabelText("New default password"), "short");
    await user.type(
      screen.getByLabelText("Confirm default password"),
      "different",
    );
    await user.click(
      screen.getByRole("button", { name: "Save default password" }),
    );
    expect(screen.getByText("The passwords don't match.")).toBeTruthy();
    expect(setStaffDefaultPasswordAction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByLabelText("Confirm default password"),
    );
  });

  it("protects pending saves, preserves failed input, retries and clears secrets on close", async () => {
    const user = await open();
    let finish!: (value: { ok: false; error: string }) => void;
    vi.mocked(setStaffDefaultPasswordAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const password = "x";
    await user.type(screen.getByLabelText("New default password"), password);
    await user.type(
      screen.getByLabelText("Confirm default password"),
      password,
    );
    await user.click(
      screen.getByRole("button", { name: "Save default password" }),
    );
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "Default password" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Saving…" })).toHaveProperty(
      "disabled",
      true,
    );
    await act(async () =>
      finish({ ok: false, error: "Could not save. Try again." }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not save. Try again.",
    );
    expect(screen.getByLabelText("New default password")).toHaveProperty(
      "value",
      password,
    );
    expect(toast.add).not.toHaveBeenCalled();
    vi.mocked(setStaffDefaultPasswordAction).mockResolvedValueOnce({
      ok: true,
    });
    await user.click(
      screen.getByRole("button", { name: "Save default password" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(setStaffDefaultPasswordAction).toHaveBeenLastCalledWith({
      password,
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(toast.add).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Default password" }));
    expect(screen.getByLabelText("New default password")).toHaveProperty(
      "value",
      "",
    );
  });

  it("asks before discarding a changed default", async () => {
    const user = await open();
    await user.type(
      screen.getByLabelText("New default password"),
      "Draft default",
    );
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(setStaffDefaultPasswordAction).not.toHaveBeenCalled();
  });
});
