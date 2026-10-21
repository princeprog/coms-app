// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SalesReport } from "../schemas/sales-report.schema";
import { SalesReportWorkspace } from "./sales-report-workspace";

const { params, replace, getSalesReportAction } = vi.hoisted(() => ({
  params: { value: new URLSearchParams() },
  replace: vi.fn(),
  getSalesReportAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/sales-report",
  useSearchParams: () => params.value,
}));
vi.mock("../services/sales-report-actions", () => ({ getSalesReportAction }));
vi.mock("./report-trend-chart", () => ({
  ReportTrendChart: () => <div>Trend chart</div>,
}));

const branch = "00000000-0000-4000-8000-000000000001";
const totals = {
  gross_sales: "650.00",
  net_sales: "500.00",
  sales_count: 3,
  average_sale: "166.67",
  items_sold: "4",
  void_count: 1,
  void_amount: "150.00",
  food_cost: "177.00",
  gross_profit: "323.00",
  food_cost_percent: "35.4",
  cost_coverage_percent: "90",
};
function report(patch: Partial<SalesReport> = {}): SalesReport {
  return {
    period: "week",
    period_range: { from: "2026-10-12", to: "2026-10-18" },
    range: { from: "2026-10-12", to: "2026-10-18" },
    previous_range: { from: "2026-10-05", to: "2026-10-11" },
    in_progress: false,
    branch: null,
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
    headline: totals,
    previous: { ...totals, net_sales: "400.00" },
    changes: {
      gross_sales: "10",
      net_sales: "25",
      sales_count: "0",
      average_sale: null,
      void_amount: "50",
      gross_profit: "-5",
      food_cost_percent_points: "2.1",
    },
    cash: {
      closed_shifts: 1,
      short_shifts: 1,
      over_shifts: 0,
      cash_difference: "-20.00",
      short_amount: "-20.00",
      over_amount: "0.00",
    },
    stock: { approved_reports: 0, waste_value: "0.00", variance_value: "0.00" },
    by_branch: [
      {
        branch_id: branch,
        branch_name: "Manila - Ermita",
        sales_count: 3,
        net_sales: "500.00",
        average_sale: "166.67",
        cash_difference: "-20.00",
        food_cost: "177.00",
        gross_profit: "323.00",
      },
    ],
    by_payment: [
      { name: "GCash", sales_count: 1, amount: "150.00", share_percent: "30" },
    ],
    by_service: [
      {
        service_type: "TAKEAWAY",
        sales_count: 1,
        amount: "300.00",
        share_percent: "60",
      },
    ],
    by_category: [],
    top_products: [],
    daily: [],
    ...patch,
  };
}

function mount(search = "") {
  params.value = new URLSearchParams(search);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SalesReportWorkspace />
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
  getSalesReportAction.mockReset();
  getSalesReportAction.mockResolvedValue({ ok: true, data: report() });
});

describe("sales report", () => {
  it("shows headline numbers with their comparison", async () => {
    mount("period=week&date=2026-10-14");
    const hero = await screen.findByRole("region", { name: "Net sales" });
    expect(within(hero).getByText("₱500.00")).toBeTruthy();
    expect(within(hero).getByText("Last week: ₱400.00")).toBeTruthy();
    expect(getSalesReportAction).toHaveBeenCalledWith({
      period: "week",
      date: "2026-10-14",
      branch_id: undefined,
    });
    expect(within(hero).getByText("+25%").className).toContain("emerald");
    // Rising food cost is bad news.
    expect(screen.getByText("+2.1 pts").className).toContain("red");
    expect(screen.getByText("No earlier sales")).toBeTruthy();
    const profit = screen.getByRole("region", { name: "Gross profit" });
    expect(within(profit).getByText("₱323.00")).toBeTruthy();
    expect(
      within(profit).getByText("Food cost covers 90% of net sales."),
    ).toBeTruthy();
    expect(
      within(profit).getByRole("img", {
        name: "Food cost is 35.4% of net sales",
      }),
    ).toBeTruthy();
    expect(screen.getByText("All branches · vs previous week")).toBeTruthy();
    const payments = screen.getByRole("list", { name: "Payment methods" });
    expect(within(payments).getByText("GCash")).toBeTruthy();
    expect(within(payments).getByText("30%")).toBeTruthy();
  });

  it("steps between periods through the URL", async () => {
    const user = userEvent.setup();
    mount("period=week&date=2026-10-14");
    await screen.findByText("Oct 12 – 18, 2026");
    await user.click(screen.getByRole("button", { name: "Previous period" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/sales-report?period=week&date=2026-10-05",
      { scroll: false },
    );
    await user.click(screen.getByRole("tab", { name: "Month" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/sales-report?period=month&date=2026-10-14",
      { scroll: false },
    );
    await user.click(screen.getByRole("button", { name: "This week" }));
    expect(replace).toHaveBeenLastCalledWith("/sales-report?period=week", {
      scroll: false,
    });
  });

  it("hides profit without cost access and explains an empty period", async () => {
    getSalesReportAction.mockResolvedValue({
      ok: true,
      data: report({
        show_costs: false,
        headline: {
          ...totals,
          sales_count: 0,
          void_count: 0,
          food_cost: null,
          gross_profit: null,
        },
      }),
    });
    mount();
    expect(await screen.findByText("No sales in this period")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Gross profit" })).toBeNull();
    expect(screen.queryByText("Waste value")).toBeNull();
    expect(screen.getByRole("region", { name: "Daily reports" })).toBeTruthy();
  });

  it("downloads the PDF for the shown period and recovers from errors", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: "Try later" }, { status: 500 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    mount(`period=week&date=2026-10-14&branch=${branch}`);
    await user.click(
      await screen.findByRole("button", { name: "Download PDF" }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/exports/sales-report-pdf?period=week&date=2026-10-18&branch_id=${branch}`,
      ),
    );

    getSalesReportAction.mockResolvedValue({
      ok: false,
      error: "COMS could not load the sales report.",
    });
    mount("period=day");
    expect(
      await screen.findByText("COMS could not load the sales report."),
    ).toBeTruthy();
  });
});
