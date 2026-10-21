// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductSetupWorkspace } from "./product-setup-workspace";
import type { ProductSetup } from "../schemas/product-setup.schema";
const {
  save,
  refresh,
  replace,
  searchBranches,
  searchCategories,
  searchStock,
} = vi.hoisted(() => ({
  save: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  searchBranches: vi.fn(),
  searchCategories: vi.fn(),
  searchStock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace, push: vi.fn() }),
}));
vi.mock("../services/product-setup-actions", () => ({
  saveProductSetupAction: save,
}));
vi.mock("../services/product-branch-actions", () => ({
  searchProductBranchesAction: searchBranches,
}));
vi.mock("../services/product-recipe-actions", () => ({
  searchRecipeStock: searchStock,
}));
vi.mock(
  "@/features/product-categories/services/product-category-actions",
  () => ({ searchAvailableCategoriesAction: searchCategories }),
);
const category = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Meals",
  is_active: true,
};
const id = "00000000-0000-4000-8000-000000000001",
  branch = "00000000-0000-4000-8000-000000000003";
const initial = {
  product: {
    id,
    category_id: category.id,
    category_name: category.name,
    category_is_active: true,
    product_name: "Chicken meal",
    price: "125.005",
    price_revision: 1,
    description: null,
    is_active: true,
    service_types: ["DINE_IN", "TAKEAWAY"],
    setup_revision: 1,
    recipe_line_count: 0,
    created_at: "2026-10-10T01:00:00.000Z",
    updated_at: "2026-10-10T01:00:00.000Z",
  },
  branch_ids: [branch],
  recipe: [],
} as ProductSetup;
const rice = {
  id: "00000000-0000-4000-8000-000000000004",
  stock_item_name: "Rice",
  unit: "kg",
  is_active: true,
};
function mount(data: ProductSetup | null = initial, canManage = true) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <ProductSetupWorkspace
        initial={data}
        canManage={canManage}
        branches={[
          {
            id: branch,
            name: "Dining branch",
            status: "active",
            serviceTypes: ["DINE_IN", "TAKEAWAY"],
          },
        ]}
      />
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
  Element.prototype.scrollIntoView = vi.fn();
  searchCategories.mockReset().mockResolvedValue({
    ok: true,
    data: { items: [category], total: 1, page: 1, page_size: 10 },
  });
  searchStock
    .mockReset()
    .mockResolvedValue({ items: [rice], total: 1, page: 1 });
  save.mockReset();
  refresh.mockReset();
  replace.mockReset();
  searchBranches.mockReset();
});
describe("simple product form", () => {
  it("does not preselect a category or save without a deliberate selection", async () => {
    const user = userEvent.setup();
    mount(null);
    expect(screen.getByText("Select a category")).toBeTruthy();
    expect(searchCategories).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Product name"), "New meal");
    await user.type(screen.getByLabelText("Selling price"), "100");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    expect(await screen.findByText("Select an active category.")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Product name")).toHaveProperty(
      "value",
      "New meal",
    );
  });
  it("keeps an archived category readable and requires an active replacement for a full save", async () => {
    const user = userEvent.setup();
    mount({
      ...initial,
      product: { ...initial.product, category_is_active: false },
    });
    expect(screen.getByText("Meals (Archived)")).toBeTruthy();
    await user.type(screen.getByLabelText("Product name"), " updated");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    expect(await screen.findByText("Select an active category.")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    save.mockResolvedValue({
      ok: false,
      error: "Category was archived. Select an active category.",
    });
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(await screen.findByRole("option", { name: "Meals" }));
    expect(screen.queryByText("Select an active category.")).toBeNull();
    expect(
      screen.queryByText(/Select an active category before saving/),
    ).toBeNull();
    expect(
      screen
        .getByRole("combobox", { name: /Category/ })
        .getAttribute("aria-invalid"),
    ).toBe("false");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    expect(await screen.findByText(/Category was archived/)).toBeTruthy();
    expect(screen.getByLabelText("Product name")).toHaveProperty(
      "value",
      "Chicken meal updated",
    );
    expect(
      screen.getByRole("combobox", { name: /Category/ }).textContent,
    ).toContain("Meals");
    save.mockResolvedValue({ ok: true, data: initial });
    await user.click(screen.getByRole("button", { name: "Save product" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(save.mock.calls[0][1].product.category_id).toBe(category.id);
    expect(save.mock.calls[0][2]).toBe(save.mock.calls[1][2]);
  });
  it("creates a priced product with deliberate branch selection and an empty recipe", async () => {
    const user = userEvent.setup();
    save.mockResolvedValue({ ok: true, data: initial });
    mount(null);
    expect(
      screen
        .getByRole("checkbox", { name: "Dining branch" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    await user.type(screen.getByLabelText("Product name"), "Bottled drink");
    await user.type(screen.getByLabelText("Selling price"), "55.001");
    await user.click(screen.getByRole("combobox", { name: /Category/ }));
    await user.click(await screen.findByRole("option", { name: "Meals" }));
    await user.click(screen.getByRole("checkbox", { name: "Dining branch" }));
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1]).toEqual({
      expected_product_revision: 0,
      product: {
        category_id: category.id,
        product_name: "Bottled drink",
        price: "55.001",
        description: null,
        service_types: ["DINE_IN", "TAKEAWAY"],
        branch_ids: [branch],
      },
      recipe: [],
    });
    expect(
      screen.getByText("No recipe. Sales of this product won't deduct stock."),
    ).toBeTruthy();
  });
  it("adds a recipe line and saves it with the product", async () => {
    const user = userEvent.setup();
    save.mockResolvedValue({ ok: true, data: initial });
    mount();
    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    await user.click(screen.getByLabelText("Stock item, line 1"));
    await user.click(await screen.findByRole("option", { name: /Rice/ }));
    await user.type(screen.getByLabelText("Quantity per sale, line 1"), "0.25");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1].recipe).toEqual([
      { stock_item_id: rice.id, quantity: "0.25", usage_scope: "ALL" },
    ]);
  });
  it("keeps an incomplete recipe line as a draft with a field error", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Add stock item" }));
    await user.type(screen.getByLabelText("Quantity per sale, line 1"), "1");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    expect(await screen.findByText("Choose a stock item.")).toBeTruthy();
    expect(screen.getByText(/Check the highlighted recipe lines/)).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Quantity per sale, line 1")).toHaveProperty(
      "value",
      "1",
    );
  });
  it("shows a saved recipe read-only", () => {
    mount(
      {
        ...initial,
        recipe: [
          {
            stock_item_id: rice.id,
            stock_item_name: "Rice",
            unit: "kg",
            is_active: true,
            usage_scope: "TAKEAWAY",
            quantity: "0.25",
          },
        ],
      },
      false,
    );
    expect(screen.getByRole("heading", { name: "Recipe" })).toBeTruthy();
    expect(screen.getByText("0.25 kg")).toBeTruthy();
    expect(screen.getByText("Takeout only")).toBeTruthy();
  });
  it("preserves price and branch drafts after errors and reuses identical retry keys", async () => {
    const user = userEvent.setup();
    save
      .mockResolvedValueOnce({
        ok: false,
        error: "Product changed. Reload and review.",
      })
      .mockResolvedValueOnce({ ok: true, data: initial });
    mount();
    const price = screen.getByLabelText("Selling price");
    await user.clear(price);
    await user.type(price, "130.123");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    expect(
      await screen.findByText(/Product changed. Reload and review./),
    ).toBeTruthy();
    expect(price).toHaveProperty("value", "130.123");
    expect(
      screen
        .getByRole("checkbox", { name: "Dining branch" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    await user.click(screen.getByRole("button", { name: "Save product" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(save.mock.calls[0][2]).toBe(save.mock.calls[1][2]);
  });
  it("shows read-only product information without management or retired actions", () => {
    mount(initial, false);
    expect(screen.queryByRole("textbox", { name: "Product name" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save product" })).toBeNull();
    expect(screen.getByText("₱125.005")).toBeTruthy();
    expect(screen.getByText("Dining branch")).toBeTruthy();
    expect(screen.queryByText("Request recipe change")).toBeNull();
  });
  it("searches branches after a debounce without losing selected branches or the product draft", async () => {
    const user = userEvent.setup();
    const otherBranch = "00000000-0000-4000-8000-000000000004";
    searchBranches.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: otherBranch,
            name: "Market branch",
            status: "active",
            serviceTypes: ["TAKEAWAY"],
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      },
    });
    save.mockResolvedValue({ ok: true, data: initial });
    mount();
    expect(screen.getByRole("checkbox", { name: "Takeout" })).toBeTruthy();
    const search = screen.getByRole("textbox", { name: "Search branches" });
    await user.type(search, "Market");
    expect(searchBranches).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("checkbox", { name: "Market branch" }),
    ).toBeTruthy();
    expect(searchBranches).toHaveBeenLastCalledWith({
      page: 1,
      search: "Market",
    });
    expect(screen.getByText("Takeout only")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "Market branch" }));
    expect(screen.getByText("2 selected")).toBeTruthy();
    expect(screen.getByLabelText("Selling price")).toHaveProperty(
      "value",
      "125.005",
    );
    await user.click(screen.getByRole("button", { name: "Save product" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1].product.branch_ids).toEqual([
      branch,
      otherBranch,
    ]);
  });
  it("selects only eligible branches and removes a selection from the tray", async () => {
    const user = userEvent.setup();
    const closed = "00000000-0000-4000-8000-000000000005";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProductSetupWorkspace
          initial={null}
          canManage
          branches={[
            {
              id: branch,
              name: "Dining branch",
              status: "active",
              serviceTypes: ["DINE_IN", "TAKEAWAY"],
            },
            {
              id: closed,
              name: "Closed branch",
              status: "inactive",
              serviceTypes: ["DINE_IN"],
            },
          ]}
        />
      </QueryClientProvider>,
    );
    const dining = screen.getByRole("checkbox", { name: "Dining branch" });
    const inactive = screen.getByRole("checkbox", { name: "Closed branch" });
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(dining.getAttribute("aria-checked")).toBe("true");
    expect(inactive.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("1 selected")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Remove Dining branch" }),
    );
    expect(dining.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("0 selected")).toBeTruthy();
    expect(
      screen.queryByRole("group", { name: "Selected branches" }),
    ).toBeNull();
  });
});
