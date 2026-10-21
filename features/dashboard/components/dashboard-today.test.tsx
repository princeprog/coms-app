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
vi.mock("./week-trend", () => ({ WeekTrend: () => <div>Week chart</div> }));

const branch = "00000000-0000-4000-8000-000000000001";
function today(patch: Partial<DashboardToday> = {}): DashboardToday {
  return {
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
    },
    yesterday_same_time: { net_sales: "150.00", sales_count: 1 },
    changes: { net_sales: "200", sales_count: "200" },
    attention: [
      { key: "deliveries_overdue", count: 2 },
      { key: "open_discrepancies", count: 0 },
      { key: "reports_to_review", count: 1 },
      { key: "deliveries_in_transit", count: 1 },
    ],
    branches: [
      {
        branch_id: branch,
        branch_name: "Manila - Ermita",
        status: "active",
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
  it("shows today's sales with yesterday's comparison and the urgent items first", async () => {
    mount();
    const hero = await screen.findByRole("region", { name: "Today so far" });
    expect(within(hero).getByText("₱450.00")).toBeTruthy();
    expect(within(hero).getAllByText("+200%")[0].className).toContain(
      "emerald",
    );
    expect(
      within(hero).getByText("Yesterday at this time: ₱150.00"),
    ).toBeTruthy();
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
        today: { ...today().today, food_cost: null, gross_profit: null },
        attention: [{ key: "deliveries_overdue", count: 0 }],
      }),
    });
    mount(`branch=${branch}`);
    expect(await screen.findByText("All clear")).toBeTruthy();
    expect(getDashboardTodayAction).toHaveBeenCalledWith(branch);
    expect(screen.queryByText("Gross profit")).toBeNull();
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
