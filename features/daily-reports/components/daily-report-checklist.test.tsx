// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DailyReport } from "../types/daily-report.types";
import { DailyReportChecklist } from "./daily-report-checklist";
import { DailyReportShifts } from "./daily-report-shifts";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const id = (n: number) =>
  `3fa85f64-5717-4562-b3fc-2c963f66af${String(n).padStart(2, "0")}`;

const item = (n: number, counted: string | null) => ({
  id: id(n),
  stock_item_id: id(n + 20),
  stock_item_name: `Item ${n}`,
  unit: "kg",
  opening_quantity: "5",
  receipt_quantity: "0",
  sale_consumption_quantity: "1",
  sale_void_reversal_quantity: "0",
  ledger_adjustment_quantity: "0",
  ledger_closing_quantity: "4",
  waste_quantity: "0",
  waste_reason: null,
  adjustment_quantity: "0",
  adjustment_reason: null,
  expected_closing_quantity: "4",
  physical_closing_quantity: counted,
  variance_quantity: counted === null ? null : "0",
});

const shift = (
  n: number,
  status: "OPEN" | "CLOSED" | "REVIEWED",
  cash: string | null,
  nonCash: string | null,
  difference: string | null,
) => ({
  id: id(n + 40),
  shift_number: n,
  status,
  close_type: status === "OPEN" ? null : ("CASHIER" as const),
  cashier_name: `Cashier ${n}`,
  opened_at: "2026-09-23T00:00:00.000Z",
  closed_at: status === "OPEN" ? null : "2026-09-23T08:00:00.000Z",
  sales_count: 3,
  net_cash_sales: cash,
  non_cash_sales: nonCash,
  cash_difference: difference,
  opening_difference: null,
});

const report: DailyReport = {
  id: id(1),
  branch_id: branchId,
  business_date: "2026-09-23",
  business_day_ended: true,
  status: "DRAFT",
  idempotency_key: id(2),
  created_by_user_id: id(3),
  submitted_by_user_id: null,
  submitted_at: null,
  reviewed_by_user_id: null,
  reviewed_at: null,
  return_reason: null,
  completed_sales_amount: "0",
  completed_sales_count: 0,
  voided_sales_amount: "0",
  voided_sales_count: 0,
  created_at: "2026-09-24T02:00:00.000Z",
  updated_at: "2026-09-24T02:00:00.000Z",
  items: [item(1, "4"), item(2, null)],
  events: [],
  pending_deliveries: [
    {
      id: id(9),
      dispatched_at: null,
      receive_by: null,
      receiving_status: "OVERDUE",
    },
  ],
  shifts: [
    shift(1, "REVIEWED", "1200.5", "300", "0"),
    shift(2, "CLOSED", "980", "450.25", "-12.5"),
    shift(3, "OPEN", null, null, null),
  ],
};

const todo = (name: string) => screen.getByText(name).closest("li")!;

describe("daily report checklist", () => {
  it("explains the development bypass without claiming the checklist is complete", () => {
    render(
      <DailyReportChecklist
        branchId={branchId}
        report={{ ...report, submission_checklist_bypassed: true }}
        hasUnsavedChanges={false}
      />,
    );
    expect(
      screen.getByText(/checklist is bypassed in development/i),
    ).toBeTruthy();
    expect(screen.queryByText("Ready to submit")).toBeNull();
  });

  it("lists every submit blocker with links to the shifts involved", () => {
    render(
      <DailyReportChecklist
        branchId={branchId}
        report={{ ...report, business_day_ended: false }}
        hasUnsavedChanges
      />,
    );

    expect(screen.getByText("5 to do")).toBeTruthy();
    expect(
      within(todo("Business day has ended")).getByText(
        "You can submit once the business day is over.",
      ),
    ).toBeTruthy();
    expect(
      within(todo("All shifts closed")).getByRole("link", { name: "Shift 3" }),
    ).toBeTruthy();
    expect(
      within(todo("All shifts reviewed")).getByRole("link", {
        name: "Shift 2",
      }),
    ).toBeTruthy();
    expect(
      within(todo("Every item counted")).getByText(
        "1 of 2 items counted · save your changes",
      ),
    ).toBeTruthy();
    expect(
      within(todo("Deliveries counted or explained")).getByText(
        /1 delivery needs/,
      ),
    ).toBeTruthy();
  });

  it("shows ready to submit when nothing blocks the report", () => {
    render(
      <DailyReportChecklist
        branchId={branchId}
        report={{
          ...report,
          items: [item(1, "4")],
          pending_deliveries: [],
          shifts: [shift(1, "REVIEWED", "1200.5", "300", "0")],
        }}
        hasUnsavedChanges={false}
      />,
    );

    expect(screen.getByText("Ready to submit")).toBeTruthy();
    expect(screen.getAllByText("Done:")).toHaveLength(5);
  });
});

describe("daily report shifts", () => {
  it("totals closed shifts exactly and labels the scope when one is open", () => {
    render(<DailyReportShifts branchId={branchId} report={report} />);

    const totals = screen.getByText("Total for 2 closed shifts").closest("tr")!;
    expect(within(totals).getByText("₱2,180.50")).toBeTruthy();
    expect(within(totals).getByText("₱750.25")).toBeTruthy();
    expect(within(totals).getByText("Short ₱12.50")).toBeTruthy();
  });
});
