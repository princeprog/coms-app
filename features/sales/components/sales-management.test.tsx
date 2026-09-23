// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SalesManagement } from "./sales-management";
import type { SalesViewResult } from "@/features/sales/services/sales-page-loader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";
const createAction = vi.fn();
const voidAction = vi.fn();

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
    expect(screen.getByRole("form", { name: "Search products" })).toBeTruthy();
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
});
