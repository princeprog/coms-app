// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Dispatch,
  DispatchReceiveAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchReceiveControl } from "./dispatch-receive-control";

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

describe("dispatch receive control", () => {
  it("records an exact partial receipt for in-transit lines", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue(idempotencyKeys[0]),
    });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchReceiveAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchReceiveControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Receive stock" }));
    await user.type(screen.getByLabelText("Flour received (kg)"), "1.2345");
    expect(screen.getByLabelText("Flour received (kg)")).toBeTruthy();
    expect(screen.queryByLabelText("Sugar received (kg)")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        dispatchId,
        {
          items: [
            { dispatch_item_id: flourLineId, quantity_received: "1.2345" },
          ],
        },
        idempotencyKeys[0],
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("requires a positive quantity and rejects amounts above remaining transit", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchReceiveAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchReceiveControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Receive stock" }));
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /enter at least one positive quantity/i,
    );
    expect(action).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Flour received (kg)"), "4.5001");
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /cannot exceed 4.5000 kg remaining in transit/i,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("keeps a retry key for unchanged input and rotates it when input changes", async () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(idempotencyKeys[0])
        .mockReturnValueOnce(idempotencyKeys[1]),
    });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchReceiveAction>()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: false, error: "Still unavailable." })
      .mockResolvedValueOnce({ ok: true });
    render(<DispatchReceiveControl dispatch={dispatch} action={action} />);

    await user.click(screen.getByRole("button", { name: "Receive stock" }));
    const quantity = screen.getByLabelText("Flour received (kg)");
    await user.type(quantity, "1.5");
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));

    const retryQuantity = screen.getByLabelText("Flour received (kg)");
    await user.clear(retryQuantity);
    await user.type(retryQuantity, "2.0");
    await user.click(screen.getByRole("button", { name: "Confirm receipt" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(3));
    expect(action.mock.calls[0]?.[2]).toBe(idempotencyKeys[0]);
    expect(action.mock.calls[1]?.[2]).toBe(idempotencyKeys[0]);
    expect(action.mock.calls[2]?.[2]).toBe(idempotencyKeys[1]);
  });
});
