// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  completedDifference,
  dispatchCompletionSummary,
} from "../services/dispatch-completion-summary";
import { describe, expect, it, vi } from "vitest";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";
import {
  DispatchDetailView,
  type DispatchDetailViewProps,
} from "./dispatch-detail-view";

vi.mock("../services/count-reminder-action", () => ({
  sendCountReminderAction: vi.fn(),
}));
vi.mock("../services/dispatch-actions", () => ({
  reviewLateCountAction: vi.fn(),
}));
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
const countedAt = "2026-09-24T02:00:00.000Z";
const counted: Dispatch = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  status: "PARTIALLY_RECEIVED",
  created_by_user_id: id,
  created_by_name: "Commissary Staff",
  dispatched_by_user_id: id,
  dispatched_by_name: "Commissary Staff",
  dispatched_at: timestamp,
  delivered_by_name: "Juan Dela Cruz",
  counted_by_user_id: id,
  counted_by_name: "Branch Manager",
  counted_at: countedAt,
  created_at: timestamp,
  updated_at: countedAt,
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_dispatched: "8",
      quantity_received: "7",
      quantity_shortage_closed: "0",
      quantity_surplus_closed: "0",
      quantity_in_transit: "0",
      quantity_outstanding: "1",
      quantity_variance: "-1",
      awaiting_count: false,
    },
  ],
  receipts: [
    {
      id,
      received_by_user_id: id,
      receiver_name: "Branch Manager",
      note: "One bag was torn open.",
      created_at: countedAt,
      items: [
        {
          receipt_item_id: id,
          dispatch_item_id: id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_received: "7",
        },
      ],
    },
  ],
  shortage_closures: [],
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
  ],
  discrepancy: {
    id,
    status: "OPEN",
    reported_by_user_id: id,
    reported_by_name: "Branch Manager",
    reported_at: countedAt,
    recount_requested_by_user_id: null,
    recount_requested_by_name: null,
    recount_requested_at: null,
    resolved_at: null,
  },
};

function renderView(overrides: Partial<DispatchDetailViewProps> = {}) {
  return render(
    <DispatchDetailView
      dispatch={counted}
      canDispatch={false}
      postAction={vi.fn()}
      canReceive={false}
      receiveAction={vi.fn()}
      canResolve={false}
      resolveAction={vi.fn()}
      {...overrides}
    />,
  );
}

describe("dispatch detail view", () => {
  it("shows the courier, the counter, and each counted difference", () => {
    renderView();
    expect(
      screen.getByRole("link", { name: "Back to dispatches" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Needs review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Juan Dela Cruz").length).toBeGreaterThan(0);
    const table = screen.getByRole("table", { name: "Dispatch items" });
    expect(
      within(table).getByRole("columnheader", { name: "Difference" }),
    ).toBeTruthy();
    expect(within(table).getByText("−1")).toBeTruthy();
    const activity = screen.getByRole("list", { name: "Delivery activity" });
    expect(
      within(activity).getByRole("heading", { name: "Final count submitted" }),
    ).toBeTruthy();
    expect(within(activity).getByText("One bag was torn open.")).toBeTruthy();
    expect(screen.getByText("1 kg short")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Resolve variance" }),
    ).toBeNull();
  });

  it("offers resolution only when granted", () => {
    renderView({ canResolve: true });
    expect(
      screen.getByRole("button", { name: "Resolve variance" }),
    ).toBeTruthy();
  });

  it("hides sent quantities from the receiver until the count", () => {
    renderView({
      canReceive: true,
      dispatch: {
        ...counted,
        status: "IN_TRANSIT",
        counted_at: null,
        counted_by_name: null,
        receipts: [],
        discrepancy: null,
        items: [
          {
            ...counted.items[0],
            quantity_dispatched: null,
            quantity_received: "0",
            quantity_in_transit: null,
            quantity_outstanding: null,
            quantity_variance: null,
            awaiting_count: true,
          },
        ],
      },
    });
    const table = screen.getByRole("table", { name: "Dispatch items" });
    expect(within(table).getByText("Hidden until counted")).toBeTruthy();
    expect(within(table).queryByText("8")).toBeNull();
    expect(screen.getByRole("button", { name: "Count delivery" })).toBeTruthy();
  });

  it("offers sending only for a draft the user can dispatch", () => {
    renderView({
      canDispatch: true,
      dispatch: {
        ...counted,
        status: "DRAFT",
        dispatched_at: null,
        dispatched_by_user_id: null,
        dispatched_by_name: null,
        delivered_by_name: null,
        counted_at: null,
        receipts: [],
        discrepancy: null,
        events: [{ ...counted.events[0], event_type: "CREATED" }],
      },
    });
    expect(screen.getByRole("button", { name: "Send dispatch" })).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Planned quantity" }),
    ).toBeTruthy();
  });

  it("records the resolution outcome and hides actions once resolved", () => {
    renderView({
      canReceive: true,
      canResolve: true,
      dispatch: {
        ...counted,
        status: "CLOSED_WITH_SHORTAGE",
        items: [
          {
            ...counted.items[0],
            quantity_shortage_closed: "1",
            quantity_outstanding: "0",
          },
        ],
        shortage_closures: [
          {
            id,
            closed_by_user_id: id,
            closer_name: "Commissary Manager",
            outcome: "NOT_LOADED",
            reason: "Bag was left on the loading bay.",
            created_at: "2026-09-24T03:00:00.000Z",
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
        discrepancy: { ...counted.discrepancy!, status: "RESOLVED" },
      },
    });
    expect(
      screen.getByText("Completed with resolved discrepancies"),
    ).toBeTruthy();
    expect(
      screen.queryByRole("list", { name: "Delivery milestones" }),
    ).toBeNull();
    const summaryTable = screen.getByRole("table", { name: "Dispatch items" });
    expect(within(summaryTable).getByText("Not loaded")).toBeTruthy();
    expect(within(summaryTable).getByText("1 kg short")).toBeTruthy();
    expect(
      within(summaryTable).queryByRole("columnheader", { name: "Unresolved" }),
    ).toBeNull();
    expect(screen.getByText("View activity").closest("details")?.open).toBe(
      false,
    );
    fireEvent.click(screen.getByText("View activity"));
    const activity = screen.getByRole("list", { name: "Delivery activity" });
    expect(
      within(activity).getByRole("heading", {
        name: "Variance resolved: not loaded",
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Count delivery" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Resolve variance" }),
    ).toBeNull();
  });

  it("orders activity chronologically with the count once", () => {
    renderView({
      dispatch: {
        ...counted,
        discrepancy_events: [
          {
            id: "note",
            event_type: "REPORTED",
            actor_user_id: id,
            actor_name: "Branch Manager",
            note: "One bag was torn open.",
            created_at: countedAt,
          },
        ],
      },
    });
    const activity = screen.getByRole("list", { name: "Delivery activity" });
    const entries = within(activity)
      .getAllByRole("listitem")
      .filter((entry) => entry.parentElement === activity);
    expect(entries[0].textContent).toContain("Dispatch created");
    expect(entries.at(-1)?.textContent).toContain("Count variance flagged");
    expect(within(activity).getAllByText("7 kg")).toHaveLength(1);
  });

  it("shows a concise matched summary with history collapsed and no workflow actions", () => {
    renderView({
      canReceive: true,
      canResolve: true,
      dispatch: {
        ...counted,
        status: "RECEIVED",
        discrepancy: null,
        items: [
          {
            ...counted.items[0],
            quantity_received: "8",
            quantity_variance: "0",
            quantity_outstanding: "0",
          },
        ],
        receipts: [{ ...counted.receipts[0], note: null }],
      },
    });
    expect(
      screen.getByText("Completed", { selector: "[data-slot=badge]" }),
    ).toBeTruthy();
    const table = screen.getByRole("table", { name: "Dispatch items" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Stock item", "Sent", "Received"]);
    expect(within(table).getAllByText("8 kg")).toHaveLength(2);
    expect(screen.queryByText("Delivery notes")).toBeNull();
    expect(
      screen.queryByRole("list", { name: "Delivery milestones" }),
    ).toBeNull();
    expect(screen.getByText("View activity").closest("details")?.open).toBe(
      false,
    );
    expect(
      screen.queryByRole("region", { name: "Dispatch actions" }),
    ).toBeNull();
  });

  it("preserves split resolutions, exact decimal differences and the last completion event", () => {
    const closure = {
      id,
      closed_by_user_id: id,
      closer_name: "Manager",
      outcome: "LOST" as const,
      reason: "Damaged in transit",
      created_at: "2026-09-24T03:00:00.000Z",
      items: [
        {
          closure_item_id: "lost",
          dispatch_item_id: id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_closed: "0.25",
        },
      ],
    };
    const dispatch: Dispatch = {
      ...counted,
      status: "CLOSED_WITH_SHORTAGE",
      updated_at: "2026-10-01T03:00:00.000Z",
      shortage_closures: [
        {
          ...closure,
          id: "later",
          outcome: "NOT_LOADED",
          reason: "Left at loading bay",
          created_at: "2026-09-24T04:00:00.000Z",
          items: [
            {
              ...closure.items[0],
              closure_item_id: "not-loaded",
              quantity_closed: "0.75",
            },
          ],
        },
        closure,
      ],
    };
    const summary = dispatchCompletionSummary(dispatch);
    expect(summary.completedAt).toBe("2026-09-24T04:00:00.000Z");
    expect(
      summary.resolutions
        .get(id)
        ?.map(({ quantity, outcome }) => ({ quantity, outcome })),
    ).toEqual([
      { quantity: "0.75", outcome: "Not loaded" },
      { quantity: "0.25", outcome: "Lost" },
    ]);
    expect(completedDifference("-0.000000000000000001", "kg")).toBe(
      "0.000000000000000001 kg short",
    );
    expect(completedDifference("1.25", "L")).toBe("1.25 L over");
    expect(completedDifference(null, "kg")).toBe("Not recorded");
    renderView({ dispatch });
    const resolutions = screen.getByRole("list", {
      name: "Resolutions for Flour",
    });
    expect(within(resolutions).getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(within(resolutions).getAllByText("Reason")[0]);
    expect(
      within(resolutions).getByText("Left at loading bay").closest("details")
        ?.open,
    ).toBe(true);
  });
});
