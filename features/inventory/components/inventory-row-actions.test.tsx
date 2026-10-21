// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InventoryItem } from "../types/inventory.types";
import { InventoryRowActions } from "./inventory-row-actions";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const branchA = "8d7b4c1e-2f3a-4b5c-9d6e-7f8091a2b3c4";
const branchB = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const item: InventoryItem = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  stock_item_name: "Flour",
  category: "Dry goods",
  unit: "kg",
  is_active: true,
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
  quantity_on_hand: "2.5",
  on_the_way: "0",
  reorder_level: null,
  target_level: null,
  avg_daily_use: "3.2",
  stock_status: "IN_STOCK",
};
const branchLevels = (action: ReturnType<typeof vi.fn>) => ({
  action,
  location: {
    scope: "BRANCH" as const,
    branchId: branchA,
    branchName: "Manila North",
    activeBranchIds: [branchA, branchB],
  },
});

async function openMenuItem(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Actions for Flour" }));
  await user.click(await screen.findByRole("menuitem", { name }));
  return user;
}

describe("inventory row actions", () => {
  beforeEach(() => refresh.mockClear());

  it("posts a signed decimal adjustment with a reason and idempotency key", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const onComplete = vi.fn();
    render(
      <InventoryRowActions
        item={item}
        target={{ scope: "COMMISSARY" }}
        adjustAction={action}
        canAdjust
        onComplete={onComplete}
      />,
    );

    const user = await openMenuItem("Adjust stock");
    expect(screen.getByRole("dialog").getAttribute("data-coms-ui")).toBe(
      "operational",
    );
    await user.type(screen.getByLabelText("Quantity change (kg)"), "-0.25");
    await user.type(
      screen.getByLabelText("Reason for adjustment"),
      "Physical count correction",
    );
    await user.click(screen.getByRole("button", { name: "Save adjustment" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action).toHaveBeenCalledWith(
      {
        stock_item_id: item.id,
        quantity_delta: "-0.25",
        reason: "Physical count correction",
      },
      { scope: "COMMISSARY" },
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
    );
    expect(onComplete).toHaveBeenCalledWith("Inventory adjustment recorded.");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows server errors and keeps the adjustment form available", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Insufficient inventory." });
    render(
      <InventoryRowActions
        item={item}
        target={{ scope: "BRANCH", branch_id: branchA }}
        adjustAction={action}
        canAdjust
        onComplete={vi.fn()}
      />,
    );

    const user = await openMenuItem("Adjust stock");
    await user.type(screen.getByLabelText("Quantity change (kg)"), "-5");
    await user.type(screen.getByLabelText("Reason for adjustment"), "Count");
    await user.click(screen.getByRole("button", { name: "Save adjustment" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Insufficient inventory.",
    );
  });

  it("confirms before discarding a dirty adjustment and keeps editing on cancel", async () => {
    render(
      <InventoryRowActions
        item={item}
        target={{ scope: "COMMISSARY" }}
        adjustAction={vi.fn()}
        canAdjust
        onComplete={vi.fn()}
      />,
    );

    const user = await openMenuItem("Adjust stock");
    await user.type(screen.getByLabelText("Quantity change (kg)"), "1.25");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("alertdialog", { name: "Discard adjustment?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Quantity change (kg)")).toHaveProperty(
      "value",
      "1.25",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByLabelText("Quantity change (kg)")).toBeNull();
  });

  it("sets levels for every active branch after checking the target", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    const onComplete = vi.fn();
    render(
      <InventoryRowActions
        item={item}
        target={{ scope: "BRANCH", branch_id: branchA }}
        adjustAction={vi.fn()}
        canAdjust={false}
        levels={branchLevels(action)}
        onComplete={onComplete}
      />,
    );

    const user = await openMenuItem("Set levels");
    expect(
      screen.getByText("Used about 3.2 kg a day over the last 14 days."),
    ).toBeTruthy();
    await user.type(screen.getByLabelText("Reorder at"), "5");
    await user.type(screen.getByLabelText("Target level"), "4");
    await user.click(screen.getByRole("button", { name: "Save levels" }));
    expect(
      screen.getByText("Must be more than the reorder level."),
    ).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Target level"));
    await user.type(screen.getByLabelText("Target level"), "20");
    await user.click(screen.getByRole("combobox", { name: "Apply to" }));
    await user.click(
      await screen.findByRole("option", { name: "All 2 active branches" }),
    );
    await user.click(screen.getByRole("button", { name: "Save levels" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        stock_item_id: item.id,
        scope: "BRANCH",
        branch_ids: [branchA, branchB],
        reorder_level: "5",
        target_level: "20",
      }),
    );
    expect(onComplete).toHaveBeenCalledWith(
      "Levels saved for Flour at 2 branches.",
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("clears existing commissary levels", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(
      <InventoryRowActions
        item={{ ...item, reorder_level: "5", target_level: "20" }}
        target={{ scope: "COMMISSARY" }}
        adjustAction={vi.fn()}
        canAdjust={false}
        levels={{ action, location: { scope: "COMMISSARY" } }}
        onComplete={vi.fn()}
      />,
    );

    const user = await openMenuItem("Set levels");
    expect(screen.getByLabelText("Reorder at")).toHaveProperty("value", "5");
    expect(screen.queryByRole("combobox", { name: "Apply to" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Clear levels" }));
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({
        stock_item_id: item.id,
        scope: "COMMISSARY",
        reorder_level: null,
        target_level: null,
      }),
    );
  });

  it("shows no menu when the user has no row actions", () => {
    render(
      <InventoryRowActions
        item={item}
        target={{ scope: "COMMISSARY" }}
        adjustAction={vi.fn()}
        canAdjust={false}
        onComplete={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Actions for Flour" }),
    ).toBeNull();
    expect(screen.getByText("No actions for this stock item")).toBeTruthy();
  });
});
