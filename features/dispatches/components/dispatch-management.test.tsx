// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DispatchPage } from "@/features/dispatches/types/dispatch.types";
import { DispatchManagement } from "./dispatch-management";

vi.mock("../services/dispatch-stock-actions", () => ({
  searchDispatchStock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const page: DispatchPage = { items: [], total: 0, page: 1, page_size: 25 };
const baseProps = {
  page,
  filters: {
    page: 1,
    status: "all" as const,
    discrepancyStatus: "all" as const,
  },
  canCreate: false,
  createOptions: null,
  createOptionsIssue: null,
  createAction: vi.fn(),
};

describe("dispatch management", () => {
  it("shows a useful empty state and the direct dispatch action", () => {
    render(
      <DispatchManagement
        {...baseProps}
        canCreate
        createOptionsIssue="permissions"
      />,
    );

    expect(
      screen.getByText("No dispatches have been created yet."),
    ).toBeTruthy();
    expect(screen.getByLabelText("Dispatch status")).toBeTruthy();
    expect(
      screen
        .getByRole("form", { name: "Filter dispatches" })
        .getAttribute("action"),
    ).toBe("/dispatches");
    expect(
      screen.getByRole("button", { name: "Create dispatch" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: /request/i })).toBeNull();
  });

  it("renders direct branch dispatch rows and filter-preserving pagination", async () => {
    const user = userEvent.setup();
    const dispatchPage: DispatchPage = {
      ...page,
      total: 26,
      items: [
        {
          id,
          branch_id: id,
          branch_name: "Downtown",
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
        {...baseProps}
        page={dispatchPage}
        filters={{ page: 1, status: "IN_TRANSIT", discrepancyStatus: "all" }}
      />,
    );

    expect(screen.getByText("Downtown")).toBeTruthy();
    expect(screen.getAllByText("In transit")).toHaveLength(2);
    expect(
      screen
        .getByRole("region", { name: "Dispatches table" })
        .getAttribute("data-slot"),
    ).toBe("table-container");
    screen
      .getByRole("button", { name: "Actions for Downtown dispatch" })
      .focus();
    await user.keyboard("{Enter}");
    expect(
      screen
        .getByRole("menuitem", { name: "View dispatch" })
        .getAttribute("href"),
    ).toBe(`/dispatches/${id}`);
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Stock request")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/dispatches?page=2&status=IN_TRANSIT");
  });

  it("explains when the current filters have no matching dispatches", () => {
    render(
      <DispatchManagement
        {...baseProps}
        filters={{ page: 1, status: "RECEIVED", discrepancyStatus: "all" }}
      />,
    );
    expect(screen.getByText("No dispatches match these filters.")).toBeTruthy();
  });
});
