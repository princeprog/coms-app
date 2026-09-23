// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import { DispatchManagement } from "./dispatch-management";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const page: DispatchPage = { items: [], total: 0, page: 1, page_size: 25 };

describe("dispatch management", () => {
  it("shows a useful empty state, status filter, and approved-request link", () => {
    render(
      <DispatchManagement
        page={page}
        filters={{ page: 1, status: "all" }}
        canCreate
      />,
    );

    expect(
      screen.getByText("No dispatches have been created yet."),
    ).toBeTruthy();
    expect(screen.getByLabelText("Dispatch status")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Review approved requests" })
        .getAttribute("href"),
    ).toBe("/replenishment?status=APPROVED");
  });

  it("renders branch, request, status, and filter-preserving pagination", () => {
    const dispatchPage: DispatchPage = {
      ...page,
      total: 26,
      items: [
        {
          id,
          stock_request_id: id,
          branch_id: id,
          branch_name: "Downtown",
          stock_request_status: "APPROVED",
          status: "IN_TRANSIT",
          created_by_user_id: id,
          created_by_name: "Commissary Staff",
          dispatched_by_user_id: id,
          dispatched_by_name: "Commissary Staff",
          dispatched_at: "2026-09-24T02:00:00.000Z",
          created_at: "2026-09-24T01:30:00.000Z",
          updated_at: "2026-09-24T02:00:00.000Z",
          item_count: 2,
        },
      ],
    };
    render(
      <DispatchManagement
        page={dispatchPage}
        filters={{ page: 1, status: "IN_TRANSIT" }}
        canCreate={false}
      />,
    );

    expect(screen.getByText("Downtown")).toBeTruthy();
    expect(screen.getAllByText("IN TRANSIT")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "View dispatch" }).getAttribute("href"),
    ).toBe(`/dispatches/${id}`);
    expect(
      screen.getByRole("link", { name: "View request" }).getAttribute("href"),
    ).toBe(`/replenishment/${id}`);
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/dispatches?page=2&status=IN_TRANSIT");
  });

  it("explains when the current filters have no matching dispatches", () => {
    render(
      <DispatchManagement
        page={page}
        filters={{ page: 1, status: "RECEIVED" }}
        canCreate={false}
      />,
    );
    expect(screen.getByText("No dispatches match this status.")).toBeTruthy();
  });
});
