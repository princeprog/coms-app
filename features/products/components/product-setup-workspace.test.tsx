// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductSetupWorkspace } from "./product-setup-workspace";
import type { ProductSetup } from "../schemas/product-setup.schema";
const { save, refresh, replace, searchBranches } = vi.hoisted(() => ({
  save: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  searchBranches: vi.fn(),
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
const id = "00000000-0000-4000-8000-000000000001",
  branch = "00000000-0000-4000-8000-000000000003";
const initial = {
  product: {
    id,
    product_name: "Chicken meal",
    price: "125.005",
    price_revision: 1,
    description: null,
    is_active: true,
    service_types: ["DINE_IN", "TAKEAWAY"],
    setup_revision: 1,
    created_at: "2026-10-10T01:00:00.000Z",
    updated_at: "2026-10-10T01:00:00.000Z",
  },
  branch_ids: [branch],
} as ProductSetup;
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
  save.mockReset();
  refresh.mockReset();
  replace.mockReset();
  searchBranches.mockReset();
});
describe("simple product form", () => {
  it("creates a priced product with deliberate branch selection and no recipe workflow", async () => {
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
    await user.click(screen.getByRole("checkbox", { name: "Dining branch" }));
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1]).toEqual({
      expected_product_revision: 0,
      product: {
        product_name: "Bottled drink",
        price: "55.001",
        description: null,
        service_types: ["DINE_IN", "TAKEAWAY"],
        branch_ids: [branch],
      },
    });
    expect(screen.queryByText("Product consumption")).toBeNull();
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
});
