// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CostsWorkspace } from "./costs-workspace";

const { params, replace, actions } = vi.hoisted(() => ({
  params: { value: new URLSearchParams() },
  replace: vi.fn(),
  actions: {
    getBranchProfitAction: vi.fn(),
    getProductProfitAction: vi.fn(),
    getProductCostsAction: vi.fn(),
    getStockCostsAction: vi.fn(),
    setStockCostAction: vi.fn(),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/costs",
  useSearchParams: () => params.value,
}));
vi.mock("../services/cost-actions", () => actions);

const row = {
  branch_id: "00000000-0000-4000-8000-000000000001",
  branch_name: "Manila North",
  sales_count: 3,
  net_sales: "600",
  food_cost: "228",
  gross_profit: "372",
  food_cost_percent: "38",
  cost_coverage_percent: "80",
  waste_value: "100",
  variance_value: "-50",
};

function mount(search = "") {
  params.value = new URLSearchParams(search);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CostsWorkspace canManage />
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
  for (const action of Object.values(actions)) action.mockReset();
  actions.getBranchProfitAction.mockResolvedValue({
    ok: true,
    data: {
      range: { from: "a", to: "b" },
      totals: { ...row, branch_id: null },
      branches: [row],
    },
  });
  actions.getProductProfitAction.mockResolvedValue({
    ok: true,
    data: {
      range: { from: "a", to: "b" },
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    },
  });
});

describe("costs and profit", () => {
  it("summarizes profit and warns when food cost is incomplete", async () => {
    mount();
    expect((await screen.findAllByText("₱372.00")).length).toBeGreaterThan(0);
    expect(screen.getByText("Food cost covers 80% of sales")).toBeTruthy();
    expect(screen.getAllByText("−₱50.00").length).toBeGreaterThan(0);
  });

  it("flags products without a recipe or with uncosted stock", async () => {
    actions.getProductCostsAction.mockResolvedValue({
      ok: true,
      data: {
        total: 2,
        page: 1,
        page_size: 10,
        items: [
          {
            product_id: "00000000-0000-4000-8000-000000000002",
            product_name: "Tapsilog",
            category_name: "Silog meals",
            price: "169",
            service_types: ["DINE_IN", "TAKEAWAY"],
            recipe_line_count: 4,
            dine_in_cost: "70",
            takeout_cost: "80",
            dine_in_margin: "99",
            takeout_margin: "89",
            lowest_margin_percent: "52.7",
            missing_cost_items: ["Garlic"],
          },
          {
            product_id: "00000000-0000-4000-8000-000000000003",
            product_name: "Mineral Water 300ml",
            category_name: "Beverages",
            price: "20",
            service_types: ["DINE_IN", "TAKEAWAY"],
            recipe_line_count: 0,
            dine_in_cost: "0",
            takeout_cost: "0",
            dine_in_margin: "20",
            takeout_margin: "20",
            lowest_margin_percent: "100",
            missing_cost_items: [],
          },
        ],
      },
    });
    mount("view=products");
    expect(await screen.findByText("Missing cost")).toBeTruthy();
    expect(screen.getByText("Garlic")).toBeTruthy();
    expect(screen.getByText("No recipe")).toBeTruthy();
    expect(screen.getByText("52.7%")).toBeTruthy();
  });

  it("requires a reason before setting a stock cost", async () => {
    const user = userEvent.setup();
    actions.getStockCostsAction.mockResolvedValue({
      ok: true,
      data: {
        total: 1,
        page: 1,
        page_size: 10,
        items: [
          {
            stock_item_id: "00000000-0000-4000-8000-000000000004",
            stock_item_name: "Garlic",
            category: "Vegetables and aromatics",
            unit: "kg",
            average_unit_cost: null,
            last_unit_cost: null,
            last_received_at: null,
            cost_source: null,
            updated_at: null,
          },
        ],
      },
    });
    actions.setStockCostAction.mockResolvedValue({ ok: true, data: {} });
    mount("view=stock");
    expect(await screen.findByText("No cost yet")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Actions for Garlic" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Set cost" }));
    await user.type(screen.getByLabelText("Cost per kg"), "130");
    await user.click(screen.getByRole("button", { name: "Save cost" }));
    expect(await screen.findByText(/at least 3 characters/)).toBeTruthy();
    expect(actions.setStockCostAction).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Reason"), "Market price");
    await user.click(screen.getByRole("button", { name: "Save cost" }));
    await waitFor(() =>
      expect(actions.setStockCostAction).toHaveBeenCalledWith(
        "00000000-0000-4000-8000-000000000004",
        { unit_cost: "130", reason: "Market price" },
      ),
    );
  });
});
