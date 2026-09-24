// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SalesManagement } from "./sales-management";
import type { SalesViewResult } from "@/features/sales/services/sales-page-loader";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace }),
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
  branchOptions: [{ id: branchId, name: "Downtown", status: "active" }],
  selectedBranch: { id: branchId, name: "Downtown", status: "active" },
  menuPage: {
    items: [
      {
        branch_id: branchId,
        branch_name: "Downtown",
        product_id: productId,
        product_name: "Chicken sandwich",
        description: null,
        product_is_active: true,
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
  salesPage: {
    items: [
      {
        id: saleId,
        branch_id: branchId,
        cashier_user_id: saleId,
        cashier_name: "Mina Cashier",
        status: "COMPLETED",
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
  it("connects branch choice, menu search, checkout, and sales history", () => {
    render(
      <SalesManagement
        view={baseView}
        createAction={createAction}
        voidAction={voidAction}
      />,
    );

    expect(screen.getByLabelText("Branch")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    ).toBeTruthy();
    const searchForm = screen.getByRole("form", { name: "Search products" });
    expect(searchForm.hasAttribute("method")).toBe(false);
    expect(searchForm.querySelector('input[name="page"]')).toBeNull();
    expect(screen.getByRole("table", { name: "Sales history" })).toBeTruthy();
    expect(screen.getByText("Mina Cashier")).toBeTruthy();
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
    expect(screen.getByRole("alert").textContent).toContain(
      "branch_products.read",
    );
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
            { id: nextBranchId, name: "Airport", status: "active" },
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
    expect(screen.getByLabelText("Estimated total").textContent).toBe("0");
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
