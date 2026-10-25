// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ShiftReport } from "../schemas/shift.schema";
import { ShiftCashDrawer } from "./shift-cash-drawer";
import { ShiftHeadline } from "./shift-headline";
import { ShiftProductsSold } from "./shift-products-sold";
import { ShiftSalesBreakdown } from "./shift-sales-breakdown";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

function shift(overrides: Partial<ShiftReport>): ShiftReport {
  return {
    id,
    branch_id: id,
    branch_name: "Cebu Banilad",
    business_date: "2026-10-22",
    shift_number: 2,
    status: "OPEN",
    opened_by_user_id: id,
    opened_by_name: "Ana Reyes",
    opened_at: "2026-10-22T01:00:00.000Z",
    schedule_status: null,
    scheduled_shift_name: null,
    opening_float: "1500",
    expected_opening_float: "1500",
    opening_difference: "0",
    closed_by_user_id: null,
    closed_by_name: null,
    closed_at: null,
    close_type: null,
    force_close_reason: null,
    counted_cash: null,
    left_in_drawer: null,
    expected_cash: null,
    cash_difference: null,
    cashier_explanation: null,
    reviewed_by_user_id: null,
    reviewed_by_name: null,
    reviewed_at: null,
    review_note: null,
    business_day_ends_at: "2026-10-22T16:00:00.000Z",
    business_day_ended: false,
    sales_count: 4,
    totals: {
      cash_sales_amount: null,
      non_cash_sales_amount: null,
      cash_refunds_amount: null,
      cash_in_amount: "200",
      cash_out_amount: "0",
      expected_cash: null,
      sales_count: 4,
      voids_count: 0,
    },
    payments: [],
    cash_movements: [],
    voids: [],
    cash_hidden: true,
    sales_summary: null,
    products: [],
    ...overrides,
  };
}

function renderReport(value: ShiftReport) {
  render(
    <>
      <ShiftHeadline shift={value} />
      <ShiftCashDrawer shift={value} />
      <ShiftSalesBreakdown shift={value} />
      <ShiftProductsSold shift={value} />
    </>,
  );
}

describe("shift report", () => {
  it("keeps sales and expected cash out of a cashier's blind count", () => {
    renderReport(shift({}));

    expect(screen.getByText("Shown after you count the drawer")).toBeTruthy();
    expect(screen.getByText("After you count")).toBeTruthy();
    expect(screen.queryByText("Cash sales")).toBeNull();
    expect(screen.queryByText("Cash refunds")).toBeNull();
    expect(
      screen.getByText("Sales totals are shown after you count the drawer."),
    ).toBeTruthy();
    expect(
      screen.getByText("Products are shown after you count the drawer."),
    ).toBeTruthy();
    expect(screen.getByText("₱1,500.00")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("explains a closed shift without sales and shows the cash handed over", () => {
    renderReport(
      shift({
        status: "CLOSED",
        cash_hidden: false,
        closed_at: "2026-10-22T05:00:00.000Z",
        counted_cash: "1690.5",
        left_in_drawer: "1000",
        expected_cash: "1700",
        cash_difference: "-9.5",
        sales_count: 0,
        totals: {
          cash_sales_amount: "0",
          non_cash_sales_amount: "0",
          cash_refunds_amount: "0",
          cash_in_amount: "200",
          cash_out_amount: "0",
          expected_cash: "1700",
          sales_count: 0,
          voids_count: 0,
        },
        sales_summary: {
          sales_count: 0,
          gross_amount: "0",
          voided_count: 0,
          voided_amount: "0",
          completed_count: 0,
          net_amount: "0",
          average_amount: null,
          items_sold: "0",
          dine_in_count: 0,
          dine_in_amount: "0",
          takeaway_count: 0,
          takeaway_amount: "0",
          first_sale_at: null,
          last_sale_at: null,
        },
      }),
    );

    expect(screen.getByText("No sales were made in this shift.")).toBeTruthy();
    expect(screen.getByText("No completed sales in this shift.")).toBeTruthy();
    expect(screen.getAllByText("Short ₱9.50")).toHaveLength(2);
    expect(screen.getByText("Removed from drawer")).toBeTruthy();
    expect(screen.getByText("₱690.50")).toBeTruthy();
  });
});
