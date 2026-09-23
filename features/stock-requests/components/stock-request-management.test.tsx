// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StockRequestPage } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestManagement } from "./stock-request-management";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const page: StockRequestPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: 25,
};

describe("stock request management", () => {
  it("shows a useful empty state and accessible status filter", () => {
    render(
      <StockRequestManagement
        page={page}
        filters={{ page: 1, status: "all", branch_id: "all" }}
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );
    expect(
      screen.getByText("No stock requests have been submitted yet."),
    ).toBeTruthy();
    expect(screen.getByLabelText("Request status")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply filters" })).toBeTruthy();
  });

  it("renders branch, requester, status, item count, and detail link", () => {
    const requestPage: StockRequestPage = {
      ...page,
      total: 1,
      items: [
        {
          id,
          branch_id: id,
          branch_name: "Downtown",
          requested_by_user_id: id,
          requester_name: "Branch Manager",
          status: "PENDING",
          item_count: 2,
          created_at: "2026-09-24T01:30:00.000Z",
          updated_at: "2026-09-24T01:30:00.000Z",
        },
      ],
    };
    render(
      <StockRequestManagement
        page={requestPage}
        filters={{ page: 1, status: "all", branch_id: "all" }}
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );
    expect(screen.getByText("Downtown")).toBeTruthy();
    expect(screen.getByText("Branch Manager")).toBeTruthy();
    expect(screen.getByText("PENDING")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "View request" }).getAttribute("href"),
    ).toBe(`/replenishment/${id}`);
  });
});
