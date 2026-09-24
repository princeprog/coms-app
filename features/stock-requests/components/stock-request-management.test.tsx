// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Branch } from "@/features/branches/types/branch.types";
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
const otherBranchId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const branches: Branch[] = [
  {
    id,
    code: "DT",
    branch_name: "Downtown",
    address: null,
    date_opened: null,
    has_dine_in: false,
    status: "active",
  },
  {
    id: otherBranchId,
    code: "UP",
    branch_name: "Uptown",
    address: null,
    date_opened: null,
    has_dine_in: false,
    status: "active",
  },
];
const page: StockRequestPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: 25,
};

describe("stock request management", () => {
  it("preserves a scoped branch filter when branch choices are unavailable", () => {
    render(
      <StockRequestManagement
        page={page}
        filters={{ page: 1, status: "PENDING", branch_id: id }}
        branchOptions={[]}
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );

    const form = screen.getByRole("form", { name: "Filter stock requests" });
    expect(
      form.querySelector('input[name="branch_id"]')?.getAttribute("value"),
    ).toBe(id);
  });

  it("uses client GET filters and retains the selected branch and status", async () => {
    const user = userEvent.setup();
    render(
      <StockRequestManagement
        page={page}
        filters={{ page: 2, status: "PENDING", branch_id: id }}
        branchOptions={branches}
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );

    const form = screen.getByRole("form", { name: "Filter stock requests" });
    expect(form.getAttribute("action")).toBe("/replenishment");
    expect(form.getAttribute("method")).toBeNull();
    expect(form.querySelector('input[name="page"]')).toBeNull();
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(await screen.findByRole("option", { name: "Uptown" }));
    await user.click(screen.getByRole("combobox", { name: "Request status" }));
    await user.click(await screen.findByRole("option", { name: "Approved" }));

    expect(
      form.querySelector('input[name="branch_id"]')?.getAttribute("value"),
    ).toBe(otherBranchId);
    expect(
      form.querySelector('input[name="status"]')?.getAttribute("value"),
    ).toBe("APPROVED");
  });

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
