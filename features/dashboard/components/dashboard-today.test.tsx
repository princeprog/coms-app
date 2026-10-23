// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { DashboardTodayWorkspace } from "./dashboard-today";

const { params, replace, getDashboardTodayAction } = vi.hoisted(() => ({
  params: { value: new URLSearchParams() },
  replace: vi.fn(),
  getDashboardTodayAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => params.value,
}));
vi.mock("../services/dashboard-today-actions", () => ({
  getDashboardTodayAction,
}));
vi.mock("../services/dashboard-exceptions-actions", () => ({
  getDashboardExceptionsAction: () => new Promise(() => {}),
}));
vi.mock("./week-trend", () => ({ WeekTrend: () => <div>Week chart</div> }));
vi.mock("./hourly-trend", () => ({
  HourlyTrend: () => <div>Hourly chart</div>,
}));

const branch = "00000000-0000-4000-8000-000000000001";
function today(patch: Partial<DashboardToday> = {}): DashboardToday {
  return {
    workspace: "overview",
    access: { reports: true, shifts: true, sales: true, dispatches: true },
    submission_checklist_bypassed: false,
    report_progress: [
      {
        branch_id: branch,
        period: "today",
        business_date: "2026-10-22",
        report_id: "report-1",
        status: "DRAFT",
        counted_items: 2,
        total_items: 5,
        open_shifts: 1,
        unreviewed_shifts: 0,
        pending_deliveries: 1,
        counts_awaiting_review: 0,
        day_ended: false,
        had_sales: true,
      },
      {
        branch_id: branch,
        period: "yesterday",
        business_date: "2026-10-21",
        report_id: null,
        status: "MISSING",
        counted_items: null,
        total_items: null,
        open_shifts: 0,
        unreviewed_shifts: 1,
        pending_deliveries: 1,
        counts_awaiting_review: 0,
        day_ended: true,
        had_sales: true,
      },
    ],
    count_shortages: {
      days: 7,
      branches: [
        {
          branch_id: branch,
          branch_name: "Manila - Ermita",
          reports: 3,
          short_lines: 2,
          uncosted_short_lines: 0,
          shortage_value: "640.00",
        },
      ],
      items: [
        {
          branch_id: branch,
          branch_name: "Manila - Ermita",
          stock_item_id: "s1",
          stock_item_name: "Chicken leg quarter",
          unit: "kg",
          short_quantity: "2.5",
          shortage_value: "600.00",
          times_short: 2,
          latest_report_id: "report-9",
          latest_business_date: "2026-10-20",
        },
        {
          branch_id: branch,
          branch_name: "Manila - Ermita",
          stock_item_id: "s2",
          stock_item_name: "Cooking oil",
          unit: "L",
          short_quantity: "0.5",
          shortage_value: null,
          times_short: 1,
          latest_report_id: "report-8",
          latest_business_date: "2026-10-19",
        },
      ],
    },
    report_backlog: {
      total: 12,
      items: [
        {
          branch_id: branch,
          branch_name: "Manila - Ermita",
          business_date: "2026-10-15",
          report_id: null,
          status: "MISSING",
          days_outstanding: 7,
        },
        {
          branch_id: branch,
          branch_name: "Manila - Ermita",
          business_date: "2026-10-18",
          report_id: "report-7",
          status: "RETURNED",
          days_outstanding: 4,
        },
      ],
    },
    business_date: "2026-10-22",
    as_of: new Date().toISOString(),
    scope_label: "All branches",
    branch_options: [
      { id: branch, name: "Manila - Ermita", status: "active" },
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "Cebu Branch",
        status: "active",
      },
    ],
    show_costs: true,
    today: {
      net_sales: "450.00",
      sales_count: 3,
      average_sale: "150.00",
      items_sold: "5",
      void_count: 1,
      food_cost: "112.00",
      gross_profit: "338.00",
      cost_coverage_percent: "66.7",
    },
    last_week_same_time: { net_sales: "300.00", sales_count: 2 },
    yesterday_same_time: { net_sales: "150.00", sales_count: 1 },
    changes: {
      net_sales: "50",
      sales_count: "50",
      net_sales_vs_yesterday: "200",
    },
    attention: [
      { key: "deliveries_overdue", count: 2 },
      { key: "open_discrepancies", count: 0 },
      { key: "reports_to_review", count: 1 },
      { key: "dispatches_draft", count: 2 },
      { key: "deliveries_in_transit", count: 1 },
    ],
    branches: [
      {
        branch_id: branch,
        branch_name: "Manila - Ermita",
        status: "active",
        shift_id: "shift-1",
        shift_number: 2,
        cashier_name: "Ana Cruz",
        opened_at: "2026-10-22T00:00:00Z",
        sales_count: 3,
        net_sales: "450.00",
        last_sale_at: "2026-10-22T06:35:00Z",
        yesterday_report_status: "MISSING",
      },
    ],
    last_7_days: [],
    top_products_today: [
      {
        product_id: "p1",
        name: "Tapsilog",
        quantity: "2",
        net_sales: "338.00",
      },
    ],
    hourly: [
      {
        hour: "10:00",
        sales_count: 1,
        net_sales: "150.00",
        last_week_net_sales: "100.00",
      },
    ],
    ...patch,
  };
}

function mount(search = "") {
  params.value = new URLSearchParams(search);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DashboardTodayWorkspace canOpenReport />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  replace.mockReset();
  getDashboardTodayAction.mockReset();
  getDashboardTodayAction.mockResolvedValue({ ok: true, data: today() });
});
afterEach(() => vi.useRealTimers());

describe("dashboard today", () => {
  it("keeps the selected branch when opening the sales report", async () => {
    mount(`branch=${branch}`);
    expect(
      (await screen.findByRole("link", { name: "Sales report" })).getAttribute(
        "href",
      ),
    ).toBe(`/sales-report?period=day&branch_id=${branch}`);
  });

  it("keeps previous figures visible and offers retry after a failed refresh", async () => {
    mount();
    await screen.findByRole("region", { name: "Today so far" });
    getDashboardTodayAction.mockResolvedValue({
      ok: false,
      error: "Service unavailable",
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Refresh dashboard" }),
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Showing the last successful update",
    );
    expect(
      screen.getByRole("region", { name: "Today so far" }).textContent,
    ).toContain("₱450.00");
    getDashboardTodayAction.mockResolvedValue({ ok: true, data: today() });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await vi.waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("shows count progress and opens branch actions by keyboard", async () => {
    const user = userEvent.setup();
    mount();
    expect(await screen.findByText("2 / 5 items counted")).toBeTruthy();
    expect(screen.getByText("1 open shift")).toBeTruthy();
    expect(screen.getByText("Business day still open")).toBeTruthy();
    const trigger = screen.getByRole("button", {
      name: "Actions for Manila - Ermita",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    const report = await screen.findByRole("menuitem", {
      name: "Today's report",
    });
    expect(report.getAttribute("href")).toContain("report_id=report-1");
    expect(report.getAttribute("href")).toContain(`report_branch=${branch}`);
    expect(
      screen
        .getByRole("menuitem", { name: "Current shift" })
        .getAttribute("href"),
    ).toBe(`/shifts/shift-1?branch=${branch}`);
    expect(
      screen
        .getByRole("menuitem", { name: "Sales report" })
        .getAttribute("href"),
    ).toBe(`/sales-report?period=day&branch_id=${branch}`);
    await user.keyboard("{Escape}");
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("shows recurring count shortages with values and links to the latest report", async () => {
    mount();
    const table = await screen.findByRole("region", {
      name: "Count shortages table",
    });
    const row = within(table).getByText("Chicken leg quarter").closest("tr")!;
    expect(row.textContent).toContain("2.5 kg");
    expect(row.textContent).toContain("₱600.00");
    expect(within(row).getByText("Recurring")).toBeTruthy();
    expect(within(row).getByRole("link").getAttribute("href")).toContain(
      "report_id=report-9",
    );
    const oil = within(table).getByText("Cooking oil").closest("tr")!;
    expect(within(oil).getByText("No cost")).toBeTruthy();
    expect(within(oil).queryByText("Recurring")).toBeNull();
    expect(
      screen.getByRole("list", { name: "Shortages by branch" }).textContent,
    ).toContain("₱640.00 short · 2 short counts in 3 reports");
  });

  it("lists older unfinished reports oldest first with links to fix them", async () => {
    mount();
    const list = await screen.findByRole("list", {
      name: "Older reports outstanding",
    });
    const links = within(list).getAllByRole("link");
    expect(links[0].textContent).toContain("Not started");
    expect(links[0].getAttribute("href")).toContain("date_from=2026-10-15");
    expect(links[0].getAttribute("href")).not.toContain("report_id");
    expect(links[1].getAttribute("href")).toContain("report_id=report-7");
    expect(screen.getByText(/Showing the oldest 2 of 12/)).toBeTruthy();
  });

  it("hides shortage values without cost access", async () => {
    getDashboardTodayAction.mockResolvedValue({
      ok: true,
      data: today({ show_costs: false }),
    });
    mount();
    const table = await screen.findByRole("region", {
      name: "Count shortages table",
    });
    expect(within(table).queryByText("Value")).toBeNull();
    expect(table.textContent).not.toContain("₱600.00");
    expect(
      screen.getByRole("list", { name: "Shortages by branch" }).textContent,
    ).not.toContain("₱");
  });

  it("hides unauthorized report progress and actions in the branch workspace", async () => {
    getDashboardTodayAction.mockResolvedValue({
      ok: true,
      data: today({
        workspace: "branch",
        access: {
          reports: false,
          shifts: false,
          sales: false,
          dispatches: false,
        },
        report_progress: [],
      }),
    });
    mount();
    expect(await screen.findByText("Your branches today")).toBeTruthy();
    expect(screen.queryByText("Today's report")).toBeNull();
    expect(screen.queryByText("Count shortages")).toBeNull();
    expect(screen.queryByText("Older reports outstanding")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Actions for Manila - Ermita" }),
    ).toBeNull();
  });

  it("does not relabel old figures while a different branch is loading", async () => {
    const client = new QueryClient();
    params.value = new URLSearchParams();
    const view = render(
      <QueryClientProvider client={client}>
        <DashboardTodayWorkspace canOpenReport />
      </QueryClientProvider>,
    );
    await screen.findByRole("region", { name: "Today so far" });
    getDashboardTodayAction.mockImplementation(() => new Promise(() => {}));
    params.value = new URLSearchParams(`branch=${branch}`);
    view.rerender(
      <QueryClientProvider client={client}>
        <DashboardTodayWorkspace canOpenReport />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole("status", { name: "Loading dashboard" }),
    ).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Today so far" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Sales report" })).toBeNull();
    view.unmount();
    client.clear();
  });

  it("shows affected stock and shortage amounts with record links", async () => {
    getDashboardTodayAction.mockResolvedValue({
      ok: true,
      data: today({
        attention: [
          {
            key: "commissary_stock_below_zero",
            count: 1,
            example: {
              record_id: "stock-1",
              branch_id: null,
              branch_name: null,
              label: "Fish Sauce",
              quantity: "-0.125",
              unit: "L",
            },
          },
          {
            key: "cash_shortages",
            count: 2,
            amount: "125.50",
            branch_count: 2,
            oldest_at: "2026-10-21T03:00:00Z",
            example: {
              record_id: "shift-1",
              branch_id: branch,
              branch_name: "Manila - Ermita",
              label: "Shift 2",
              quantity: null,
              unit: null,
            },
          },
        ],
      }),
    });
    mount();
    expect(
      (
        await screen.findByRole("link", {
          name: "View: Fish Sauce · -0.125 L on hand",
        })
      ).getAttribute("href"),
    ).toBe("/inventory?scope=COMMISSARY&search=Fish%20Sauce");
    expect(
      screen.getByText("₱125.50 total short · 2 branches affected"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Oldest: Manila - Ermita/ })
        .getAttribute("href"),
    ).toBe(`/shifts/shift-1?branch=${branch}`);
  });

  it("shows today's sales with yesterday's comparison and the urgent items first", async () => {
    mount();
    const hero = await screen.findByRole("region", { name: "Today so far" });
    expect(within(hero).getByText("₱450.00")).toBeTruthy();
    // 2026-10-22 is a Thursday: compare with last Thursday.
    expect(within(hero).getAllByText("+50%")[0].className).toContain("emerald");
    expect(
      within(hero).getByText("Last Thu at this time: ₱300.00"),
    ).toBeTruthy();
    expect(
      within(hero).getByText("Yesterday at this time: ₱150.00 (+200%)"),
    ).toBeTruthy();
    expect(
      within(hero).getByText("Food cost covers 66.7% of today's sales."),
    ).toBeTruthy();
    expect(
      within(hero)
        .getByRole("tab", { name: "By hour" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(within(hero).getByText("Hourly chart")).toBeTruthy();
    expect(within(hero).getByText("₱338.00")).toBeTruthy();
    expect(
      within(hero)
        .getByRole("link", { name: "Sales report" })
        .getAttribute("href"),
    ).toBe("/sales-report?period=day");
    const links = within(
      screen.getByRole("list", { name: "Needs attention" }),
    ).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Deliveries overdue for counting2",
      "Daily report to review1",
      "Dispatches drafted but not sent2",
      "Delivery on the way1",
    ]);
    expect(links[0].getAttribute("href")).toBe(
      "/dispatches?receiving_status=OVERDUE",
    );
    const board = screen.getByRole("region", { name: "Branches today table" });
    expect(within(board).getByText("Open · Shift 2")).toBeTruthy();
    expect(within(board).getByText("Ana Cruz")).toBeTruthy();
    expect(within(board).getByText("Not started")).toBeTruthy();
  });

  it("shows all clear, hides profit without cost access and filters by branch", async () => {
    const user = userEvent.setup();
    getDashboardTodayAction.mockResolvedValue({
      ok: true,
      data: today({
        show_costs: false,
        today: {
          ...today().today,
          food_cost: null,
          gross_profit: null,
          cost_coverage_percent: null,
        },
        attention: [{ key: "deliveries_overdue", count: 0 }],
      }),
    });
    mount(`branch=${branch}`);
    expect(await screen.findByText("All clear")).toBeTruthy();
    expect(getDashboardTodayAction).toHaveBeenCalledWith(branch);
    expect(screen.queryByText("Gross profit")).toBeNull();
    expect(screen.queryByRole("note")).toBeNull();
    await user.click(screen.getByRole("combobox", { name: "Branch" }));
    await user.click(
      await screen.findByRole("option", { name: "All branches" }),
    );
    expect(replace).toHaveBeenLastCalledWith("/dashboard", { scroll: false });
  });

  it("refreshes every minute and recovers from a failed load", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mount();
    await screen.findByRole("region", { name: "Today so far" });
    expect(getDashboardTodayAction).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(getDashboardTodayAction).toHaveBeenCalledTimes(2);
    vi.useRealTimers();

    getDashboardTodayAction.mockResolvedValue({
      ok: false,
      error: "COMS could not load the dashboard. Try again.",
    });
    params.value = new URLSearchParams(
      "branch=00000000-0000-4000-8000-000000000009",
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DashboardTodayWorkspace canOpenReport={false} />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText("COMS could not load the dashboard. Try again."),
    ).toBeTruthy();
    getDashboardTodayAction.mockResolvedValue({ ok: true, data: today() });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      (await screen.findAllByRole("region", { name: "Today so far" })).length,
    ).toBe(2);
  });
});
