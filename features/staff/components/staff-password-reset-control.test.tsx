// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StaffPasswordResetControl } from "./staff-password-reset-control";
import type { StaffMember } from "../types/staff.types";

const { reset } = vi.hoisted(() => ({ reset: vi.fn() }));
vi.mock("@/features/staff/services/staff-actions", () => ({
  resetStaffPasswordAction: reset,
}));

const staff = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Ana Cruz",
} as StaffMember;

beforeEach(() => reset.mockReset());

describe("StaffPasswordResetControl", () => {
  it("confirms, shows the temporary password once and forgets it on close", async () => {
    const user = userEvent.setup();
    reset.mockResolvedValue({ ok: true, temporaryPassword: "Abc23defGhk9Mn" });
    render(<StaffPasswordResetControl staff={staff} branchId={undefined} />);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(screen.getByText(/signed out everywhere/)).toBeTruthy();
    await user.click(
      screen.getAllByRole("button", { name: "Reset password" }).at(-1)!,
    );
    expect(await screen.findByText("Abc23defGhk9Mn")).toBeTruthy();
    expect(reset).toHaveBeenCalledWith(staff.id, undefined);
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(screen.queryByText("Abc23defGhk9Mn")).toBeNull();
  });

  it("keeps the confirmation open with the error", async () => {
    const user = userEvent.setup();
    reset.mockResolvedValue({
      ok: false,
      error: "You do not have permission or access to this branch.",
    });
    render(<StaffPasswordResetControl staff={staff} />);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    await user.click(
      screen.getAllByRole("button", { name: "Reset password" }).at(-1)!,
    );
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /permission/,
    );
  });
});
