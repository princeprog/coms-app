// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  Dispatch,
  DispatchShortageAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchResolveControl } from "./dispatch-resolve-control";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const dispatchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const flourLineId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const sugarLineId = "f7d9c800-b53d-4d3e-b6a6-0ba1d42a7a3c";
const key = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const line = {
  unit: "kg",
  quantity_shortage_closed: "0",
  quantity_in_transit: "0",
  awaiting_count: false,
};
const dispatch: Dispatch = {
  id: dispatchId,
  branch_id: dispatchId,
  branch_name: "Downtown",
  status: "PARTIALLY_RECEIVED",
  created_by_user_id: dispatchId,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: dispatchId,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  counted_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  items: [
    {
      ...line,
      id: flourLineId,
      stock_item_id: flourLineId,
      stock_item_name: "Flour",
      quantity_dispatched: "5",
      quantity_received: "4",
      quantity_outstanding: "1",
      quantity_variance: "-1",
    },
    {
      ...line,
      id: sugarLineId,
      stock_item_id: sugarLineId,
      stock_item_name: "Sugar",
      quantity_dispatched: "2",
      quantity_received: "2.5",
      quantity_outstanding: "-0.5",
      quantity_variance: "0.5",
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

describe("dispatch resolve control", () => {
  it("offers lost or not loaded for a shortage and requires a reason", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => key });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchResolveControl dispatch={dispatch} action={action} />);
    await user.click(screen.getByRole("button", { name: "Resolve variance" }));
    expect(
      (screen.getByLabelText("Quantity (kg)") as HTMLInputElement).value,
    ).toBe("1");
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(screen.getByRole("radiogroup").getAttribute("aria-invalid")).toBe(
      "true",
    );
    await user.click(screen.getByRole("radio", { name: /Not loaded/ }));
    expect(
      screen.getByRole("radiogroup").getAttribute("aria-invalid"),
    ).not.toBe("true");
    await user.type(screen.getByLabelText("Reason"), "Left on the loading bay");
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        dispatchId,
        {
          outcome: "NOT_LOADED",
          reason: "Left on the loading bay",
          items: [{ dispatch_item_id: flourLineId, quantity_closed: "1" }],
        },
        key,
      ),
    );
  });

  it("identifies the missing reason for a valid 10 L surplus and clears errors as fields are corrected", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => key });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValue({ ok: true });
    const surplusDispatch: Dispatch = {
      ...dispatch,
      items: [
        {
          ...dispatch.items[1],
          stock_item_name: "Fish Sauce",
          unit: "L",
          quantity_dispatched: "20",
          quantity_received: "30",
          quantity_outstanding: "-10",
          quantity_variance: "10",
        },
      ],
    };
    render(
      <DispatchResolveControl dispatch={surplusDispatch} action={action} />,
    );
    await user.click(screen.getByRole("button", { name: "Resolve variance" }));
    const quantity = screen.getByLabelText("Quantity (L)");
    const reason = screen.getByLabelText("Reason");
    await user.clear(quantity);
    await user.type(quantity, "10");
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    const error = await screen.findByRole("alert");
    expect(error.textContent).toMatch(/enter a reason/i);
    expect(reason.getAttribute("aria-invalid")).toBe("true");
    expect(reason.getAttribute("aria-describedby")).toContain(error.id);
    expect(quantity.getAttribute("aria-invalid")).not.toBe("true");
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(action).not.toHaveBeenCalled();

    await user.type(reason, "   ");
    expect(reason.getAttribute("aria-invalid")).toBe("true");
    await user.type(reason, "Extra bottles packed");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.clear(quantity);
    await user.type(quantity, "0");
    expect(quantity.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toMatch(
      /quantity greater than zero/i,
    );
    await user.clear(quantity);
    await user.type(quantity, "10");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        dispatchId,
        {
          outcome: "SURPLUS",
          reason: "Extra bottles packed",
          items: [{ dispatch_item_id: sugarLineId, quantity_closed: "10" }],
        },
        key,
      ),
    );
  });

  it("confirms a surplus and blocks quantities above the unresolved amount", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => key });
    const user = userEvent.setup();
    const action = vi
      .fn<DispatchShortageAction>()
      .mockResolvedValue({ ok: true });
    render(<DispatchResolveControl dispatch={dispatch} action={action} />);
    await user.click(screen.getByRole("button", { name: "Resolve variance" }));
    await user.selectOptions(screen.getByLabelText("Stock item"), sugarLineId);
    expect(screen.getByText(/counted more than was sent/)).toBeTruthy();
    const quantity = screen.getByLabelText("Quantity (kg)");
    await user.clear(quantity);
    await user.type(quantity, "0.6");
    await user.type(screen.getByLabelText("Reason"), "Extra sack packed");
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    expect((await screen.findByRole("alert")).textContent).toMatch(/0.5 kg/);
    await user.clear(quantity);
    await user.type(quantity, "0.5");
    await user.click(
      screen.getByRole("button", { name: "Confirm resolution" }),
    );
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        dispatchId,
        {
          outcome: "SURPLUS",
          reason: "Extra sack packed",
          items: [{ dispatch_item_id: sugarLineId, quantity_closed: "0.5" }],
        },
        key,
      ),
    );
  });
});
