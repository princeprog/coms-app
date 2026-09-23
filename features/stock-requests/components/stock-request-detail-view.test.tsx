// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StockRequest } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestDetailView } from "./stock-request-detail-view";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";
const request: StockRequest = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  requested_by_user_id: id,
  requester_name: "Branch Manager",
  status: "PENDING",
  created_at: timestamp,
  updated_at: timestamp,
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_requested: "12.5000",
      created_at: timestamp,
    },
  ],
  events: [
    {
      id,
      event_type: "SUBMITTED",
      actor_user_id: id,
      actor_name: "Branch Manager",
      created_at: timestamp,
    },
  ],
};

describe("stock request detail view", () => {
  it("shows exact item quantities and the request audit history", () => {
    render(
      <StockRequestDetailView
        request={request}
        canApprove={false}
        canReject={false}
        canCancel={false}
        transitionAction={vi.fn()}
        canCreateDispatch={false}
        createDispatchAction={vi.fn()}
      />,
    );

    expect(screen.getByText("12.5000")).toBeTruthy();
    expect(screen.getByText("SUBMITTED")).toBeTruthy();
    expect(screen.getByText("Branch Manager")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Back to replenishment" })
        .getAttribute("href"),
    ).toBe("/replenishment");
    expect(
      screen.queryByRole("button", { name: "Approve request" }),
    ).toBeNull();
  });

  it("shows only the transitions granted for a pending request", () => {
    render(
      <StockRequestDetailView
        request={request}
        canApprove={true}
        canReject={false}
        canCancel={true}
        transitionAction={vi.fn()}
        canCreateDispatch={false}
        createDispatchAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Approve request" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel request" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reject request" })).toBeNull();
  });

  it("offers dispatch preparation only for an approved request with access", () => {
    render(
      <StockRequestDetailView
        request={{ ...request, status: "APPROVED" }}
        canApprove={false}
        canReject={false}
        canCancel={false}
        transitionAction={vi.fn()}
        canCreateDispatch={true}
        createDispatchAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Prepare dispatch" }),
    ).toBeTruthy();
  });
});
