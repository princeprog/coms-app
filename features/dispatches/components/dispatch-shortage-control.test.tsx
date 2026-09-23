// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Dispatch,
  DispatchShortageAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchShortageControl } from "./dispatch-shortage-control";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const dispatchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const flourLineId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const sugarLineId = "f7d9c800-b53d-4d3e-b6a6-0ba1d42a7a3c";
const idempotencyKeys = [
  "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  "20e44ac1-cf09-4f85-8e10-1ac05ba3b785",
];

const dispatch: Dispatch = {
  id: dispatchId,
  stock_request_id: dispatchId,
  branch_id: dispatchId,
  branch_name: "Downtown",
  stock_request_status: "APPROVED",
  status: "PARTIALLY_RECEIVED",
  created_by_user_id: dispatchId,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: dispatchId,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: "2026-09-24T01:30:00.000Z",
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
  items: [
    {
      id: flourLineId,
      stock_request_item_id: flourLineId,
      stock_item_id: flourLineId,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_requested: "8",
      quantity_dispatched: "8",
      quantity_received: "2.5000",
      quantity_shortage_closed: "1",
      quantity_in_transit: "4.5000",
    },
    {
      id: sugarLineId,
      stock_request_item_id: sugarLineId,
      stock_item_id: sugarLineId,
      stock_item_name: "Sugar",
      unit: "kg",
      quantity_requested: "3",
      quantity_dispatched: "3",
      quantity_received: "3",
      quantity_shortage_closed: "0",
      quantity_in_transit: "0",
    },
  ],
  receipts: [],
  shortage_closures: [],
  events: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("dispatch shortage control", () => {
  it("requires a reason and records only quantities still in transit", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKeys[0]),
    });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchShortageControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Close shortage" }));
    const reason = screen.getByLabelText("Reason for shortage closure");
    await user.type(reason, "   ");
    await user.type(
      screen.getByLabelText("Flour shortage closed (kg)"),
      "1.25",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm shortage closure" }),
    );
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /enter a reason/i,
    );
    expect(action).not.toHaveBeenCalled();

    await user.clear(reason);
    await user.type(reason, "Damaged before arrival");
    await user.click(
      screen.getByRole("button", { name: "Confirm shortage closure" }),
    );
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        dispatchId,
        {
          reason: "Damaged before arrival",
          items: [{ dispatch_item_id: flourLineId, quantity_closed: "1.25" }],
        },
        idempotencyKeys[0],
      ),
    );
    expect(screen.queryByLabelText("Sugar shortage closed (kg)")).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("rejects a shortage quantity above remaining transit", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchShortageControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Close shortage" }));
    await user.type(
      screen.getByLabelText("Reason for shortage closure"),
      "Missing from delivery",
    );
    await user.type(
      screen.getByLabelText("Flour shortage closed (kg)"),
      "4.5001",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm shortage closure" }),
    );

    expect((await screen.findByRole("alert")).textContent).toMatch(
      /cannot exceed 4.5000 kg remaining in transit/i,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("reuses an unchanged retry key and rotates it when the reason changes", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(idempotencyKeys[0])
        .mockReturnValueOnce(idempotencyKeys[1]),
    });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: false, error: "Still unavailable." })
      .mockResolvedValueOnce({ ok: true });
    render(<DispatchShortageControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Close shortage" }));
    const reason = screen.getByLabelText("Reason for shortage closure");
    const quantity = screen.getByLabelText("Flour shortage closed (kg)");
    await user.type(reason, "Missing from delivery");
    await user.type(quantity, "1.5");
    const confirm = screen.getByRole("button", {
      name: "Confirm shortage closure",
    });
    await user.click(confirm);
    await screen.findByRole("alert");
    await user.click(confirm);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));

    const retryReason = screen.getByLabelText("Reason for shortage closure");
    await user.clear(retryReason);
    await user.type(retryReason, "Not present in delivery");
    await user.click(confirm);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(3));
    expect(action.mock.calls[0]?.[2]).toBe(idempotencyKeys[0]);
    expect(action.mock.calls[1]?.[2]).toBe(idempotencyKeys[0]);
    expect(action.mock.calls[2]?.[2]).toBe(idempotencyKeys[1]);
  });
});
