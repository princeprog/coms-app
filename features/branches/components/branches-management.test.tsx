// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BranchesManagement } from "./branches-management";
import {
  createBranchAction,
  deactivateBranchAction,
  updateBranchAction,
} from "../services/branch-actions";

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

  it("creates a branch with its dine-in setting", async () => {
    const user = userEvent.setup();
    vi.mocked(createBranchAction).mockResolvedValue({ ok: true });
    renderBranches();

    await user.type(screen.getByLabelText("Branch code"), "MANILA_02");
    await user.type(screen.getByLabelText("Branch name"), "Manila South");
    await user.click(screen.getByLabelText("Has dine-in seating"));
    await user.click(screen.getByRole("button", { name: "Create branch" }));

    expect(createBranchAction).toHaveBeenCalledWith({
      code: "MANILA_02",
      branch_name: "Manila South",
      address: null,
      date_opened: null,
      has_dine_in: true,
    });
  });

  it("hides branch changes when the operator lacks the matching grants or scope", () => {
    renderBranches({
      canCreateBranch: false,
      branchAccess: {
        [branches.items[0].id]: { canUpdate: false, canDeactivate: false },
      },
    });

    expect(screen.queryByLabelText("Branch code")).toBeNull();
    expect(screen.queryByLabelText("Branch name for Manila North")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /deactivate branch/i }),
    ).toBeNull();
  });

  it("opens the branch deactivation confirmation with the keyboard", async () => {
    const user = userEvent.setup();
    renderBranches();

    const trigger = screen.getByRole("button", { name: "Deactivate branch" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("alertdialog", { name: /deactivate manila north/i }),
    ).toBeTruthy();
  });
});
