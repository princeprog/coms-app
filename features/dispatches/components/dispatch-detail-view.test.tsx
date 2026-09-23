// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";
import type {
  DispatchPostAction,
  DispatchReceiveAction,
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
  stock_request_id: id,
  branch_id: id,
  branch_name: "Downtown",
  stock_request_status: "APPROVED",
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
      stock_request_item_id: id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_requested: "8",
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
      />,
    );

    expect(
      screen.getByRole("link", { name: "Back to dispatches" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "View stock request" })
        .getAttribute("href"),
    ).toBe(`/replenishment/${id}`);
    expect(screen.getByRole("table", { name: "Dispatch items" })).toBeTruthy();
    expect(screen.getByText("PARTIALLY RECEIVED")).toBeTruthy();
    expect(screen.getByText("4.5 kg")).toBeTruthy();
    expect(screen.getByText("Branch Manager")).toBeTruthy();
    expect(screen.getByText("One bag was damaged during transit")).toBeTruthy();
    expect(screen.getByText("2.5000 kg")).toBeTruthy();
    expect(screen.getByText("SHORTAGE CLOSED")).toBeTruthy();
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
      />,
    );

    expect(
      screen.getByText("No branch receipts have been recorded."),
    ).toBeTruthy();
    expect(
      screen.getByText("No shortage closures have been recorded."),
    ).toBeTruthy();
  });

  it("offers a confirmed post action only when the user can dispatch a draft", () => {
    render(
      <DispatchDetailView
        dispatch={{ ...dispatch, status: "DRAFT" }}
        canDispatch={true}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={false}
        receiveAction={vi.fn<DispatchReceiveAction>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Post dispatch" })).toBeTruthy();
  });

  it("offers partial receiving only for transit quantities and granted access", () => {
    render(
      <DispatchDetailView
        dispatch={dispatch}
        canDispatch={false}
        postAction={vi.fn<DispatchPostAction>()}
        canReceive={true}
        receiveAction={vi.fn<DispatchReceiveAction>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Receive stock" })).toBeTruthy();
  });
});
