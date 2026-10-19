// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace }),
}));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const page: DispatchPage = { items: [], total: 0, page: 1, page_size: 10 };
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
  beforeEach(() => replace.mockReset());
  afterEach(() => vi.useRealTimers());

  it("shows loading while search is debounced, keeps focus, and restores results on completion", () => {
    vi.useFakeTimers();
    const { rerender } = render(<DispatchManagement {...baseProps} />);
    const search = screen.getByRole("searchbox", { name: "Search branch" });
    search.focus();
    fireEvent.change(search, { target: { value: "Main" } });
    expect(
      screen.getByLabelText("Dispatch results").getAttribute("aria-busy"),
    ).toBe("true");
    expect(screen.getByText("Loading dispatches…")).toBeTruthy();
    act(() => vi.advanceTimersByTime(349));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledExactlyOnceWith("/dispatches?search=Main", {
      scroll: false,
    });
    rerender(
      <DispatchManagement
        {...baseProps}
        filters={{ ...baseProps.filters, search: "Main" }}
      />,
    );
    expect(
      screen.getByLabelText("Dispatch results").getAttribute("aria-busy"),
    ).toBe("false");
    expect(document.activeElement).toBe(search);
    expect(screen.getByText("No dispatches match these filters.")).toBeTruthy();
  });

  it("offers 10, 20, 30 and 50 rows and resets pagination while retaining filters", async () => {
    const user = userEvent.setup();
    render(
      <DispatchManagement
        {...baseProps}
        page={{ ...page, page: 2, total: 65 }}
        filters={{
          ...baseProps.filters,
          page: 2,
          status: "IN_TRANSIT",
          search: "Main",
        }}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    expect(screen.getAllByRole("option").map((el) => el.textContent)).toEqual([
      "10",
      "20",
      "30",
      "50",
    ]);
    await user.click(screen.getByRole("option", { name: "30" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/dispatches?page_size=30&status=IN_TRANSIT&search=Main",
      { scroll: false },
    );
  });
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
    expect(screen.getAllByText("Awaiting count")).toHaveLength(2);
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

  it("orders the compact dispatch toolbar for search, status, discrepancy, then sort", () => {
    render(<DispatchManagement {...baseProps} />);

    const toolbar = screen.getByRole("form", { name: "Filter dispatches" });
    const controls = within(toolbar).getAllByRole("combobox");

    expect(within(toolbar).getByRole("searchbox")).toBeTruthy();
    expect(controls.map((control) => control.getAttribute("id"))).toEqual([
      "dispatch-status",
      "dispatch-discrepancy-status",
      "dispatch-sort",
    ]);
  });

  it("uses badges for unreported discrepancies and keeps one-page navigation visible", () => {
    const dispatchPage: DispatchPage = {
      ...page,
      total: 1,
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

    render(<DispatchManagement {...baseProps} page={dispatchPage} />);

    expect(screen.getByText("Not reported").getAttribute("data-slot")).toBe(
      "badge",
    );
    expect(
      screen.getByRole("link", { name: "Page 1" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      (
        screen.getByRole("button", {
          name: "Previous page",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Next page",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
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
