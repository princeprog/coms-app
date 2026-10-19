import { render } from "@/test/pos-render";
// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/features/sales/services/sales-price-actions", () => ({
  refreshCartPricesAction: vi.fn(),
}));
import { SalesManagement } from "./sales-management";
import type { SalesViewResult } from "@/features/sales/services/sales-page-loader";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/form", () => ({
  default: ({ children, ...props }: React.ComponentProps<"form">) => (
    <form {...props}>{children}</form>
  ),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const nextBranchId = "3fa85f64-5717-4562-b3fc-2c963f66afa9";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";
const createAction = vi.fn();
const voidAction = vi.fn();

afterEach(() => replace.mockReset());

const baseView: Extract<SalesViewResult, { status: "ready" }> = {
  status: "ready",
  filters: { branchId, page: 1, historyPage: 1, search: "" },
  branchOptions: [
    {
      id: branchId,
      name: "Downtown",
      status: "active",
      serviceTypes: ["TAKEAWAY"],
    },
  ],
  selectedBranch: {
    id: branchId,
    name: "Downtown",
    status: "active",
    serviceTypes: ["TAKEAWAY"],
  },
  menuPage: {
    items: [
      {
        branch_id: branchId,
        branch_name: "Downtown",
        product_id: productId,
        product_name: "Chicken sandwich",
        description: null,
        category_id: "aa000000-0000-4000-8000-000000000001",
        category_name: "Rice meals",
        category_is_active: true,
        product_is_active: true,
        price_revision: 1,
        price: "12.50",
        is_available: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
    total: 1,
    page: 1,
    page_size: 25,
  },
  menuIssue: null,
  categories: [
    { id: "aa000000-0000-4000-8000-000000000001", name: "Rice meals" },
  ],
  categoriesUnavailable: false,
  salesPage: {
    items: [
      {
        id: saleId,
        branch_id: branchId,
        cashier_user_id: saleId,
        cashier_name: "Mina Cashier",
        status: "COMPLETED",
        service_type: "TAKEAWAY",
        tender_method: "cash",
        total_amount: "12.50",
        idempotency_key: saleId,
        created_at: timestamp,
      },
    ],
    total: 1,
    page: 1,
    page_size: 25,
  },
  historyIssue: null,
  selectedSale: null,
  detailIssue: null,
  canCreate: true,
  canRead: true,
  canVoid: true,
};

describe("POS management", () => {
  it("separates checkout and history without discarding the cart", async () => {
    const user = userEvent.setup();
    render(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );

    expect(screen.queryByLabelText("Branch")).toBeNull();
    expect(screen.getByText("Downtown")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Search products")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Sales history" })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    await user.click(screen.getByRole("tab", { name: "Sales history" }));
    expect(
      screen.queryByRole("button", { name: "Add Chicken sandwich" }),
    ).toBeNull();
    expect(screen.getByRole("table", { name: "Sales history" })).toBeTruthy();
    expect(screen.getByText("Mina Cashier")).toBeTruthy();
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("view=history"),
      { scroll: false },
    );
    await user.click(screen.getByRole("tab", { name: "Checkout" }));
    expect(
      (
        screen.getByLabelText(
          "Quantity for Chicken sandwich",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");
  });

  it("keeps cart quantities and cash when a category returns different products", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    await user.type(screen.getByLabelText("Amount received"), "100");
    await user.click(screen.getByRole("button", { name: "Rice meals" }));
    expect(replace).toHaveBeenLastCalledWith(
      expect.stringContaining(
        "category_id=aa000000-0000-4000-8000-000000000001",
      ),
      { scroll: false },
    );
    rerender(
      <SalesManagement
        view={{
          ...baseView,
          filters: {
            ...baseView.filters,
            categoryId: baseView.categories[0].id,
          },
          menuPage: { ...baseView.menuPage!, items: [], total: 0 },
        }}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    expect(screen.getByText("No products match your filters")).toBeTruthy();
    expect(
      screen.getByLabelText("Quantity for Chicken sandwich"),
    ).toHaveProperty("value", "1");
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "100",
    );
    expect(
      screen
        .getByRole("button", { name: "Rice meals" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("preserves the order and cash through a failed product filter and retry", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    await user.type(screen.getByLabelText("Amount received"), "100");
    rerender(
      <SalesManagement
        view={{ ...baseView, menuPage: null, menuIssue: "unavailable" }}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry products" })).toBeTruthy();
    expect(
      screen.getByLabelText("Quantity for Chicken sandwich"),
    ).toHaveProperty("value", "1");
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "100",
    );
    rerender(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    expect(
      screen.getByLabelText("Quantity for Chicken sandwich"),
    ).toHaveProperty("value", "1");
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "100",
    );
  });

  it("keeps history visible and explains when menu read permission is missing", () => {
    const view = {
      ...baseView,
      menuPage: null,
      menuIssue: "permissions" as const,
      canCreate: false,
    };
    render(
      <SalesManagement
        view={view}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Menu access");
    expect(screen.getByRole("table", { name: "Sales history" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record sale" })).toBeNull();
  });

  it("clears branch-dependent cart state when the branch changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    expect(screen.getByLabelText("Quantity for Chicken sandwich")).toBeTruthy();

    rerender(
      <SalesManagement
        view={{
          ...baseView,
          branchOptions: [
            ...baseView.branchOptions,
            {
              id: nextBranchId,
              name: "Airport",
              status: "active",
              serviceTypes: ["TAKEAWAY"],
            },
          ],
          selectedBranch: {
            id: nextBranchId,
            name: "Airport",
            status: "active",
          },
          filters: { ...baseView.filters, branchId: nextBranchId },
        }}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );

    expect(screen.queryByLabelText("Quantity for Chicken sandwich")).toBeNull();
    expect(screen.getByLabelText("Estimated total").textContent).toBe("₱0.00");
  });

  it("opens selected sale details in a sheet and closes only that query selection", async () => {
    const user = userEvent.setup();
    const view: Extract<SalesViewResult, { status: "ready" }> = {
      ...baseView,
      filters: {
        ...baseView.filters,
        page: 2,
        historyPage: 3,
        search: "chicken",
        saleId,
      },
      selectedSale: {
        id: saleId,
        branch_id: branchId,
        cashier_user_id: saleId,
        status: "COMPLETED",
        service_type: "TAKEAWAY",
        tender_method: "cash",
        total_amount: "12.50",
        idempotency_key: saleId,
        created_at: timestamp,
        items: [
          {
            id: productId,
            product_id: productId,
            product_name_snapshot: "Chicken sandwich",
            quantity: "1",
            unit_price: "12.50",
            line_total: "12.50",
            created_at: timestamp,
          },
        ],
        events: [
          {
            id: branchId,
            event_type: "COMPLETED",
            actor_user_id: saleId,
            reason: null,
            created_at: timestamp,
          },
        ],
      },
    };
    const { rerender } = render(
      <SalesManagement
        view={{
          ...view,
          filters: { ...view.filters, saleId: undefined },
          selectedSale: null,
        }}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    expect(
      (
        screen.getByLabelText(
          "Quantity for Chicken sandwich",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");
    rerender(
      <SalesManagement
        view={view}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Sale details" })).toBeTruthy();
    expect(screen.getAllByText("Chicken sandwich").length).toBeGreaterThan(1);
    await user.click(
      screen.getByRole("button", { name: "Close sale details" }),
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        `/pos?branch_id=${branchId}&page=2&history_page=3&search=chicken`,
        { scroll: false },
      ),
    );
    expect(
      (
        screen.getByLabelText(
          "Quantity for Chicken sandwich",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");
  });
});
