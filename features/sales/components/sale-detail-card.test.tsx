// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaleDetailCard } from "./sale-detail-card";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";
const filters = { branchId, page: 1, historyPage: 1, search: "" };
const action = vi.fn();

const sale = {
  id: saleId,
  branch_id: branchId,
  cashier_user_id: branchId,
  status: "VOIDED" as const,
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
      event_type: "COMPLETED" as const,
      actor_user_id: branchId,
      reason: null,
      created_at: timestamp,
    },
    {
      id: productId,
      event_type: "VOIDED" as const,
      actor_user_id: branchId,
      reason: "Cashier selected the wrong product",
      created_at: timestamp,
    },
  ],
};

describe("sale detail card", () => {
  it("shows sale snapshots and the reason from void history", () => {
    render(
      <SaleDetailCard
        sale={sale}
        branchId={branchId}
        filters={filters}
        canVoid
        voidAction={action}
      />,
    );
    expect(screen.getByRole("heading", { name: "Sale details" })).toBeTruthy();
    expect(screen.getByText("Chicken sandwich")).toBeTruthy();
    expect(
      screen.getByText(/Reason: Cashier selected the wrong product/),
    ).toBeTruthy();
    expect(screen.getByText("VOIDED")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Void sale" })).toBeNull();
  });
});
