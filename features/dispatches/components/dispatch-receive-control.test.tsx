// @vitest-environment jsdom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/toast";
import type {
  Dispatch,
  DispatchReceiveAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchReceiveControl } from "./dispatch-receive-control";
import { DispatchDiscrepancyAlertHost } from "./dispatch-discrepancy-alert";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const dispatchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const flourLineId = "9a7a91d1-9c7f-4f30-a61b-4bbd039408f9";
const sugarLineId = "f7d9c800-b53d-4d3e-b6a6-0ba1d42a7a3c";
const idempotencyKey = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";

const hiddenLine = {
  stock_item_name: "Flour",
  unit: "kg",
  quantity_dispatched: null,
  quantity_received: "0",
  quantity_shortage_closed: "0",
  quantity_in_transit: null,
  quantity_outstanding: null,
  quantity_variance: null,
  awaiting_count: true,
};
const dispatch: Dispatch = {
  id: dispatchId,
  branch_id: dispatchId,
  branch_name: "Downtown",
  status: "IN_TRANSIT",
  created_by_user_id: dispatchId,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: dispatchId,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  counted_at: null,
  created_at: timestamp,
  updated_at: timestamp,
  items: [
    { ...hiddenLine, id: flourLineId, stock_item_id: flourLineId },
    {
      ...hiddenLine,
      id: sugarLineId,
      stock_item_id: sugarLineId,
      stock_item_name: "Sugar",
    },
  ],
  receipts: [],
  shortage_closures: [],
  events: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  refresh.mockReset();
});

async function openDialog(action: DispatchReceiveAction, current = dispatch) {
  const user = userEvent.setup();
  render(<DispatchReceiveControl dispatch={current} action={action} />);
  await user.click(screen.getByRole("button", { name: "Count delivery" }));
  return user;
}

describe("dispatch receive control", () => {
  it("requires a late reason without asking for a delivery date", async () => {
    const action = vi
      .fn<DispatchReceiveAction>()
      .mockResolvedValue({ ok: true });
    const user = await openDialog(action, {
      ...dispatch,
      receive_by: "2020-01-01T00:00:00.000Z",
    });
    await user.type(screen.getByLabelText("Flour counted (kg)"), "1");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "2");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    expect(screen.getByText("Explain why this count is late.")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Reason for late count"),
      "Delivery arrived late",
    );
    await user.click(screen.getByRole("button", { name: "Review count" }));
    expect(
      screen.getByText(
        "The receiving date and time are recorded when you submit.",
      ),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1]).not.toHaveProperty("delivery_date");
    expect(action.mock.calls[0][1]).toHaveProperty(
      "late_reason",
      "Delivery arrived late",
    );
  });

  it("rechecks the deadline when confirming a count left open past its deadline", async () => {
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const action = vi.fn<DispatchReceiveAction>();
    const user = await openDialog(action, {
      ...dispatch,
      receive_by: new Date(now + 1000).toISOString(),
    });
    await user.type(screen.getByLabelText("Flour counted (kg)"), "1");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "2");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    now += 2000;
    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );
    expect(action).not.toHaveBeenCalled();
    expect(await screen.findByLabelText("Reason for late count")).toBeTruthy();
    expect(screen.getByText("Explain why this count is late.")).toBeTruthy();
  });

  it("never shows sent quantities and requires a count for every line", async () => {
    const action = vi.fn<DispatchReceiveAction>();
    const user = await openDialog(action);
    expect(screen.getByRole("dialog").getAttribute("data-coms-ui")).toBe(
      "operational",
    );
    expect(screen.queryByText(/in transit/i)).toBeNull();
    expect(screen.queryByLabelText("Actual delivery date")).toBeNull();
    expect(
      screen.getByRole("dialog").querySelector('input[type="date"]'),
    ).toBeNull();
    await user.type(screen.getByLabelText("Flour counted (kg)"), "5");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Use 0/);
    expect(action).not.toHaveBeenCalled();
  });

  it("reviews the final count, then submits zero lines and the note once", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => idempotencyKey) });
    const action = vi
      .fn<DispatchReceiveAction>()
      .mockResolvedValueOnce({ ok: false, error: "Try again." })
      .mockResolvedValueOnce({ ok: true });
    const user = await openDialog(action);
    await user.type(screen.getByLabelText("Flour counted (kg)"), "4.5");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "0");
    await user.type(
      screen.getByLabelText("Condition or issues (optional)"),
      "Sugar sack missing",
    );
    await user.click(screen.getByRole("button", { name: "Review count" }));
    expect(screen.getByText(/final count can.t be changed/i)).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );
    await screen.findByRole("alert");
    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    const body = {
      items: [
        { dispatch_item_id: flourLineId, quantity_received: "4.5" },
        { dispatch_item_id: sugarLineId, quantity_received: "0" },
      ],
      note: "Sugar sack missing",
    };
    expect(action.mock.calls[0]).toEqual([dispatchId, body, idempotencyKey]);
    expect(action.mock.calls[1]).toEqual([dispatchId, body, idempotencyKey]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("returns to editing from the review step", async () => {
    const user = await openDialog(vi.fn<DispatchReceiveAction>());
    await user.type(screen.getByLabelText("Flour counted (kg)"), "1");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "2");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    await user.click(screen.getByRole("button", { name: "Back to edit" }));
    expect(
      (screen.getByLabelText("Flour counted (kg)") as HTMLInputElement).value,
    ).toBe("1");
  });

  async function submitCount(action: DispatchReceiveAction) {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => idempotencyKey) });
    const user = await openDialog(action);
    await user.type(screen.getByLabelText("Flour counted (kg)"), "12");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "3");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  }

  it("opens a discrepancy alert that stays open after the page refreshes", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => idempotencyKey) });
    const add = vi.spyOn(toast, "add");
    const action = vi.fn<DispatchReceiveAction>().mockResolvedValue({
      ok: true,
      receiving_outcome: "POSTED",
      differences: [
        { stock_item_name: "Flour", unit: "kg", quantity_variance: "2" },
        { stock_item_name: "Sugar", unit: "kg", quantity_variance: "-1.5" },
      ],
    });
    const user = userEvent.setup();
    const page = (current: Dispatch) => (
      <>
        <DispatchReceiveControl dispatch={current} action={action} />
        <DispatchDiscrepancyAlertHost />
      </>
    );
    const view = render(page(dispatch));
    await user.click(screen.getByRole("button", { name: "Count delivery" }));
    await user.type(screen.getByLabelText("Flour counted (kg)"), "12");
    await user.type(screen.getByLabelText("Sugar counted (kg)"), "3");
    await user.click(screen.getByRole("button", { name: "Review count" }));
    await user.click(
      screen.getByRole("button", { name: "Submit final count" }),
    );

    const alert = await screen.findByRole("alertdialog", {
      name: "Delivery count has a discrepancy",
    });
    expect(add).not.toHaveBeenCalled();
    const rows = within(alert).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Flour2 kg over",
      "Sugar1.5 kg short",
    ]);
    // After the refresh the delivery is counted and the control renders nothing.
    view.rerender(
      page({
        ...dispatch,
        counted_at: timestamp,
        items: dispatch.items.map((item) => ({
          ...item,
          awaiting_count: false,
        })),
      }),
    );
    expect(screen.queryByRole("button", { name: "Count delivery" })).toBeNull();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "OK, got it" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("confirms a matching count without a warning", async () => {
    const add = vi.spyOn(toast, "add");
    await submitCount(
      vi.fn<DispatchReceiveAction>().mockResolvedValue({
        ok: true,
        receiving_outcome: "POSTED",
        differences: [],
      }),
    );
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Delivery count recorded",
      }),
    );
  });
});
