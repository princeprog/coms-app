// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryAdjustmentDialog } from "./inventory-adjustment-dialog";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const item = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  stock_item_name: "Flour",
  category: "Dry goods",
  unit: "kg",
  is_active: true,
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
  quantity_on_hand: "2.5",
};

describe("inventory adjustment dialog", () => {
  beforeEach(() => refresh.mockClear());

  it("posts a signed decimal adjustment with a reason and idempotency key", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true });
    const onComplete = vi.fn();
    render(
      <InventoryAdjustmentDialog
        item={item}
        target={{ scope: "COMMISSARY" }}
        action={action}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adjust Flour" }));
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
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "Insufficient inventory." });
    render(
      <InventoryAdjustmentDialog
        item={item}
        target={{ scope: "BRANCH", branch_id: item.id }}
        action={action}
        onComplete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adjust Flour" }));
    await user.type(screen.getByLabelText("Quantity change (kg)"), "-5");
    await user.type(screen.getByLabelText("Reason for adjustment"), "Count");
    await user.click(screen.getByRole("button", { name: "Save adjustment" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Insufficient inventory.",
    );
    expect(action).toHaveBeenCalledWith(
      expect.any(Object),
      { scope: "BRANCH", branch_id: item.id },
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
    );
  });
});
