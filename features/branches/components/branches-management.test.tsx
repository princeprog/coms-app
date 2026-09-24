// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BranchesManagement } from "./branches-management";
import {
  createBranchAction,
  deactivateBranchAction,
  updateBranchAction,
} from "../services/branch-actions";

// Base UI dispatches PointerEvents, while the current jsdom runtime exposes MouseEvent only.
if (!window.PointerEvent) {
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    value: window.MouseEvent,
  });
}

vi.mock("../services/branch-actions", () => ({
  createBranchAction: vi.fn(),
  deactivateBranchAction: vi.fn(),
  updateBranchAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const branches = {
  items: [
    {
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      code: "MANILA_01",
      branch_name: "Manila North",
      address: "North Avenue",
      date_opened: "2024-05-01",
      has_dine_in: true,
      status: "active" as const,
    },
  ],
  total: 1,
  page: 1,
  page_size: 25,
};

function renderBranches(
  overrides: Partial<ComponentProps<typeof BranchesManagement>> = {},
) {
  return render(
    <BranchesManagement
      branches={branches}
      branchAccess={{
        [branches.items[0].id]: { canUpdate: true, canDeactivate: true },
      }}
      canCreateBranch
      {...overrides}
    />,
  );
}

describe("branch management", () => {
  beforeEach(() => {
    vi.mocked(createBranchAction).mockReset();
    vi.mocked(deactivateBranchAction).mockReset();
    vi.mocked(updateBranchAction).mockReset();
  });

  it("shows a compact table and opens editing only from the row action", async () => {
    const user = userEvent.setup();
    renderBranches();

    const table = screen.getByRole("table", { name: "Branches" });
    expect(
      within(table).getByRole("columnheader", { name: "Branch" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Code" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Address" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Date opened" }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("columnheader", { name: "Dine-in" }),
    ).toBeTruthy();
    expect(within(table).getByText("North Avenue")).toBeTruthy();
    expect(within(table).getByText("Available")).toBeTruthy();
    expect(screen.queryByLabelText("Branch code")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Edit Manila North" }));
    const dialog = screen.getByRole("dialog", { name: "Edit branch" });
    expect(within(dialog).getByLabelText("Branch name")).toHaveProperty(
      "value",
      "Manila North",
    );
    expect(within(dialog).queryByLabelText("Branch code")).toBeNull();
  });

  it("creates a branch with its dine-in setting", async () => {
    const user = userEvent.setup();
    vi.mocked(createBranchAction).mockResolvedValue({ ok: true });
    renderBranches();

    await user.click(screen.getByRole("button", { name: "Add branch" }));
    await user.type(screen.getByLabelText("Branch code"), "MANILA_02");
    await user.type(screen.getByLabelText("Branch name"), "Manila South");
    await user.click(screen.getByRole("switch", { name: "Dine-in available" }));
    await user.click(screen.getByRole("button", { name: "Create branch" }));

    expect(createBranchAction).toHaveBeenCalledWith({
      code: "MANILA_02",
      branch_name: "Manila South",
      address: null,
      date_opened: null,
      has_dine_in: true,
    });
  });

  it("retains branch fields after an API validation failure", async () => {
    const user = userEvent.setup();
    vi.mocked(createBranchAction).mockResolvedValue({
      ok: false,
      error: "Branch code already exists.",
    });
    renderBranches();

    await user.click(screen.getByRole("button", { name: "Add branch" }));
    await user.type(screen.getByLabelText("Branch code"), "MANILA_02");
    await user.type(screen.getByLabelText("Branch name"), "Manila South");
    await user.click(screen.getByRole("button", { name: "Create branch" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Branch code already exists.",
    );
    expect(screen.getByLabelText("Branch code")).toHaveProperty(
      "value",
      "MANILA_02",
    );
    expect(screen.getByLabelText("Branch name")).toHaveProperty(
      "value",
      "Manila South",
    );
  });

  it("confirms before discarding a dirty branch creation draft", async () => {
    const user = userEvent.setup();
    renderBranches();

    await user.click(screen.getByRole("button", { name: "Add branch" }));
    await user.type(screen.getByLabelText("Branch code"), "MANILA_02");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const confirmation = screen.getByRole("alertdialog", {
      name: "Discard unsaved branch changes?",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Keep editing" }),
    );
    expect(screen.getByLabelText("Branch code")).toHaveProperty(
      "value",
      "MANILA_02",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const secondConfirmation = screen.getByRole("alertdialog", {
      name: "Discard unsaved branch changes?",
    });
    await user.click(
      within(secondConfirmation).getByRole("button", {
        name: "Discard changes",
      }),
    );
    expect(screen.queryByRole("dialog", { name: "Create branch" })).toBeNull();
  });

  it("preserves branch page navigation", () => {
    renderBranches({
      branches: { ...branches, total: 51, page: 1, page_size: 25 },
    });
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/branches?page=2");
  });

  it("shows an empty state without rendering an empty table", () => {
    renderBranches({
      branches: { ...branches, items: [], total: 0, page: 1, page_size: 25 },
    });
    expect(screen.queryByRole("table", { name: "Branches" })).toBeNull();
    expect(screen.getByText("No branches in this scope")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add branch" })).toBeTruthy();
  });

  it("hides branch changes when the operator lacks the matching grants or scope", () => {
    renderBranches({
      canCreateBranch: false,
      branchAccess: {
        [branches.items[0].id]: { canUpdate: false, canDeactivate: false },
      },
    });

    expect(screen.queryByRole("button", { name: "Add branch" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Edit Manila North" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /deactivate branch/i }),
    ).toBeNull();
  });

  it("updates branch fields without exposing or changing its code", async () => {
    const user = userEvent.setup();
    vi.mocked(updateBranchAction).mockResolvedValue({ ok: true });
    renderBranches();

    await user.click(screen.getByRole("button", { name: "Edit Manila North" }));
    const dialog = screen.getByRole("dialog", { name: "Edit branch" });
    await user.clear(within(dialog).getByLabelText("Branch name"));
    await user.type(
      within(dialog).getByLabelText("Branch name"),
      "Manila Central",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save branch details" }),
    );

    expect(updateBranchAction).toHaveBeenCalledWith(branches.items[0].id, {
      branch_name: "Manila Central",
      address: "North Avenue",
      date_opened: "2024-05-01",
      has_dine_in: true,
    });
  });

  it("opens the branch deactivation confirmation with the keyboard", async () => {
    const user = userEvent.setup();
    vi.mocked(deactivateBranchAction).mockResolvedValue({ ok: true });
    renderBranches();

    const trigger = screen.getByRole("button", {
      name: "Deactivate Manila North",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    const confirmation = screen.getByRole("alertdialog", {
      name: "Deactivate Manila North?",
    });
    expect(confirmation).toBeTruthy();
    await user.click(
      within(confirmation).getByRole("button", {
        name: "Confirm deactivation",
      }),
    );
    await waitFor(() =>
      expect(deactivateBranchAction).toHaveBeenCalledWith(branches.items[0].id),
    );
  });
});
