// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";
import type {
  DispatchPostAction,
  DispatchReceiveAction,
  DispatchShortageAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchDetailView } from "./dispatch-detail-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const dispatch: Dispatch = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  status: "PARTIALLY_RECEIVED",
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: id,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_dispatched: "8",
      quantity_received: "2.5000",
      quantity_shortage_closed: "1",
      quantity_in_transit: "4.5",
    },
  ],
  receipts: [
    {
      id,
      received_by_user_id: id,
      receiver_name: "Branch Manager",
      created_at: timestamp,
      items: [
        {
          receipt_item_id: id,
          dispatch_item_id: id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_received: "2.5000",
        },
      ],
    },
  ],
  shortage_closures: [
    {
      id,
      closed_by_user_id: id,
      closer_name: "Commissary Staff",
      reason: "One bag was damaged during transit",
      created_at: timestamp,
      items: [
        {
          closure_item_id: id,
          dispatch_item_id: id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_closed: "1",
        },
      ],
    },
  ],
  events: [
    {
      id,
      event_type: "DISPATCHED",
      actor_user_id: id,
      actor_name: "Commissary Staff",
      dispatch_receipt_id: null,
      shortage_closure_id: null,
      created_at: timestamp,
    },
    {
      id: "2f8b0d4c-5b2d-43e2-8c79-4a9cd4964b4e",
      event_type: "RECEIPT_RECORDED",
      actor_user_id: id,
      actor_name: "Branch Manager",
      dispatch_receipt_id: id,
      shortage_closure_id: null,
      created_at: timestamp,
    },
    {
      id: "cc6da178-6d36-4f0e-8cbb-601f68d3e17c",
      event_type: "SHORTAGE_CLOSED",
      actor_user_id: id,
      actor_name: "Commissary Staff",
      dispatch_receipt_id: null,
      shortage_closure_id: id,
      created_at: timestamp,
    },
  ],
};

describe("dispatch detail view", () => {
  it("shows quantities, transit status, receipt history, and shortage audit", () => {
    render(
      <DispatchDetailView
        dispatch={dispatch}
        canDispatch={false}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={false}
        receiveAction={vi.fn<DispatchReceiveAction>()}
        canCloseShortage={false}
        shortageAction={vi.fn<DispatchShortageAction>()}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to dispatches" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /stock request/i })).toBeNull();
    expect(screen.queryByText(/quantity requested/i)).toBeNull();
    expect(screen.getByRole("table", { name: "Dispatch items" })).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Dispatch quantities table" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Partially received").length).toBeGreaterThan(0);
    expect(within(screen.getByRole("table")).getByText("4.5")).toBeTruthy();
    const activity = screen.getByRole("list", { name: "Delivery activity" });
    expect(
      within(activity).getByRole("heading", {
        name: "Partial receipt recorded",
      }),
    ).toBeTruthy();
    expect(within(activity).getAllByText(/Branch Manager/)).toHaveLength(1);
    expect(screen.getByText("One bag was damaged during transit")).toBeTruthy();
    expect(screen.getByText("2.5000 kg")).toBeTruthy();
    expect(within(activity).getByText("Shortage closed")).toBeTruthy();
    expect(
      screen
        .getByRole("progressbar", { name: "Flour received" })
        .getAttribute("aria-valuenow"),
    ).toBe("31.2");
  });

  it("explains when a dispatch has no receipt or shortage history", () => {
    render(
      <DispatchDetailView
        dispatch={{
          ...dispatch,
          status: "DRAFT",
          dispatched_by_user_id: null,
          dispatched_by_name: null,
          dispatched_at: null,
          receipts: [],
          shortage_closures: [],
          events: [
            {
              ...dispatch.events[0],
              event_type: "CREATED",
            },
          ],
        }}
        canDispatch={false}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={false}
        receiveAction={vi.fn<DispatchReceiveAction>()}
        canCloseShortage={false}
        shortageAction={vi.fn<DispatchShortageAction>()}
      />,
    );

    expect(
      screen.queryByText("No branch receipts have been recorded."),
    ).toBeNull();
    expect(
      screen.queryByText("No shortage closures have been recorded."),
    ).toBeNull();
  });

  it("offers a confirmed post action only when the user can dispatch a draft", () => {
    render(
      <DispatchDetailView
        dispatch={{ ...dispatch, status: "DRAFT" }}
        canDispatch={true}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={false}
        receiveAction={vi.fn<DispatchReceiveAction>()}
        canCloseShortage={false}
        shortageAction={vi.fn<DispatchShortageAction>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Send dispatch" })).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Planned quantity" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("columnheader", { name: "In transit" }),
    ).toBeNull();
  });

  it("offers partial receiving only for transit quantities and granted access", () => {
    render(
      <DispatchDetailView
        dispatch={dispatch}
        canDispatch={false}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={true}
        receiveAction={vi.fn<DispatchReceiveAction>()}
        canCloseShortage={false}
        shortageAction={vi.fn<DispatchShortageAction>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Receive stock" })).toBeTruthy();
  });

  it("offers shortage closure only for transit quantities and granted access", () => {
    render(
      <DispatchDetailView
        dispatch={dispatch}
        canDispatch={false}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={false}
        receiveAction={vi.fn<DispatchReceiveAction>()}
        canCloseShortage={true}
        shortageAction={vi.fn<DispatchShortageAction>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Close shortage" })).toBeTruthy();
  });

  it("keeps a closed shortage distinct from fully received stock and hides terminal actions", () => {
    render(
      <DispatchDetailView
        dispatch={{
          ...dispatch,
          status: "CLOSED_WITH_SHORTAGE",
          items: [
            {
              ...dispatch.items[0],
              quantity_received: "2.5000",
              quantity_shortage_closed: "5.5",
              quantity_in_transit: "0",
            },
          ],
        }}
        canDispatch
        postAction={vi.fn()}
        canReceive
        receiveAction={vi.fn()}
        canCloseShortage
        shortageAction={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Delivery closed with shortage" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Receive stock" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close shortage" })).toBeNull();
    expect(
      screen
        .getByRole("progressbar", { name: "Flour received" })
        .getAttribute("aria-valuenow"),
    ).toBe("31.2");
  });

  it("does not round nearly received decimal stock to fully received", () => {
    render(
      <DispatchDetailView
        dispatch={{
          ...dispatch,
          items: [
            {
              ...dispatch.items[0],
              quantity_dispatched: "100000000000000000000.0001",
              quantity_received: "100000000000000000000",
              quantity_shortage_closed: "0",
              quantity_in_transit: "0.0001",
            },
          ],
        }}
        canDispatch={false}
        postAction={vi.fn()}
        canReceive={false}
        receiveAction={vi.fn()}
        canCloseShortage={false}
        shortageAction={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole("progressbar", { name: "Flour received" })
        .getAttribute("aria-valuenow"),
    ).toBe("99.9");
    expect(within(screen.getByRole("table")).getByText("0.0001")).toBeTruthy();
  });

  it("does not leave a receipt pending after all stock was closed as missing", () => {
    render(
      <DispatchDetailView
        dispatch={{
          ...dispatch,
          status: "CLOSED_WITH_SHORTAGE",
          receipts: [],
          items: [
            {
              ...dispatch.items[0],
              quantity_received: "0",
              quantity_shortage_closed: "8",
              quantity_in_transit: "0",
            },
          ],
        }}
        canDispatch={false}
        postAction={vi.fn()}
        canReceive={false}
        receiveAction={vi.fn()}
        canCloseShortage={false}
        shortageAction={vi.fn()}
      />,
    );
    const milestones = screen.getByRole("list", {
      name: "Delivery milestones",
    });
    expect(within(milestones).getByText("No receipt recorded")).toBeTruthy();
    expect(within(milestones).queryByText("Pending")).toBeNull();
  });

  it("merges notes and linked receipts once in chronological order", () => {
    render(
      <DispatchDetailView
        dispatch={{
          ...dispatch,
          events: [...dispatch.events].reverse(),
          discrepancy_events: [
            {
              id: "note",
              event_type: "REPORTED",
              actor_user_id: id,
              actor_name: "Alex",
              note: "Please verify the missing bags.",
              created_at: "2026-09-24T02:00:00.000Z",
            },
          ],
        }}
        canDispatch={false}
        postAction={vi.fn()}
        canReceive={false}
        receiveAction={vi.fn()}
        canCloseShortage={false}
        shortageAction={vi.fn()}
      />,
    );
    const activity = screen.getByRole("list", { name: "Delivery activity" });
    const entries = within(activity)
      .getAllByRole("listitem")
      .filter((entry) => entry.parentElement === activity);
    expect(entries).toHaveLength(5);
    expect(entries[0].textContent).toContain("Dispatch created");
    expect(entries.at(-1)?.textContent).toContain(
      "Please verify the missing bags.",
    );
    expect(within(activity).getAllByText("2.5000 kg")).toHaveLength(1);
    expect(entries.at(-1)?.textContent).toContain("10:00 AM");
  });
});
