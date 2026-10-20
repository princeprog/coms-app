// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaleDetailContent } from "./sale-detail-content";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const productId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const timestamp = "2026-09-24T01:30:00.000Z";

const sale = {
  id: saleId,
  branch_id: branchId,
  cashier_user_id: branchId,
  cashier_name: "Maria Santos",
  status: "VOIDED" as const,
  service_type: "DINE_IN" as const,
  tender_method: "GCash",
  total_amount: "1250.5",
  idempotency_key: saleId,
  created_at: timestamp,
  items: [
    {
      id: productId,
      product_id: productId,
      product_name_snapshot: "Chicken sandwich",
      quantity: "2",
      unit_price: "625.25",
      line_total: "1250.5",
      created_at: timestamp,
    },
  ],
  events: [
    {
      id: branchId,
      event_type: "COMPLETED" as const,
      actor_user_id: branchId,
      actor_name: "Maria Santos",
      reason: null,
      created_at: timestamp,
    },
    {
      id: productId,
      event_type: "VOIDED" as const,
      actor_user_id: saleId,
      actor_name: "Jose Reyes",
      reason: "Cashier selected the wrong product",
      created_at: timestamp,
    },
  ],
};

describe("sale detail content", () => {
  it("shows readable sale facts, priced items and who voided the sale", () => {
    render(<SaleDetailContent sale={sale} />);
    expect(screen.getByText("Maria Santos")).toBeTruthy();
    expect(screen.getByText("GCash")).toBeTruthy();
    expect(screen.getByText("Dine-in")).toBeTruthy();
    expect(screen.queryByText(branchId)).toBeNull();
    expect(screen.getByText("Chicken sandwich")).toBeTruthy();
    expect(screen.getByText("2 × ₱625.25")).toBeTruthy();
    expect(screen.getAllByText("₱1,250.50")).toHaveLength(2);
    const notice = screen.getByRole("region", { name: "Void details" });
    expect(notice.textContent).toContain("Voided by Jose Reyes");
    expect(notice.textContent).toContain("Cashier selected the wrong product");
  });

  it("omits the void notice and falls back when names are unavailable", () => {
    render(
      <SaleDetailContent
        sale={{
          ...sale,
          status: "COMPLETED",
          cashier_name: undefined,
          service_type: null,
          events: [sale.events[0]],
        }}
      />,
    );
    expect(screen.getByText("Staff member")).toBeTruthy();
    expect(screen.getByText("Not recorded")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Void details" })).toBeNull();
  });
});
