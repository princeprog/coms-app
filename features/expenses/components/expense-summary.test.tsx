// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpenseSummary } from "./expense-summary";
import { ExpenseHistory } from "./expense-history";
import { expensePage, ids } from "../test-fixtures";

describe("expense aggregate display", () => {
  it("renders arbitrary precision totals and keeps ratios finite and bounded", () => {
    render(
      <ExpenseSummary
        data={{
          ...expensePage,
          summary: {
            recorded_spending: "999999999999.995",
            operating_expenses: "12.3456",
            stock_purchases: "24.7000",
          },
          by_category: [],
          by_location: [
            { id: "large", name: "Large", amount: "999999999999.995" },
            { id: "tiny", name: "Tiny", amount: "0.004" },
            { id: "trailing", name: "Trailing zeros", amount: "24.7000" },
          ],
        }}
      />,
    );
    expect(screen.getAllByText("₱1,000,000,000,000.00")).toHaveLength(2);
    expect(screen.getByText("₱12.35")).toBeTruthy();
    expect(
      screen.getByLabelText("Large: ₱1,000,000,000,000.00"),
    ).toHaveProperty("value", 100);
    for (const meter of screen.getAllByRole("meter")) {
      const value = (meter as HTMLMeterElement).value;
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
  it("handles a breakdown whose amounts all round to zero", () => {
    render(
      <ExpenseSummary
        data={{
          ...expensePage,
          by_category: [],
          by_location: [{ id: "tiny", name: "Tiny", amount: "0.004" }],
        }}
      />,
    );
    expect(screen.getByLabelText("Tiny: ₱0.00")).toHaveProperty("value", 0);
  });
  it("explains unavailable location-scoped history without implying a purchase source", () => {
    render(<ExpenseHistory history={[]} />);
    expect(
      screen.getByText("No history is available for your permitted locations."),
    ).toBeTruthy();
    expect(
      screen.queryByText("This purchase is maintained in its source record."),
    ).toBeNull();
  });
  it("formats historical arbitrary precision amounts as pesos", () => {
    render(
      <ExpenseHistory
        history={[
          {
            id: ids.expense,
            action: "CREATED",
            reason: null,
            actor_name: "Manager",
            created_at: "2026-01-10T03:00:00Z",
            before: null,
            after: { amount: "12.3456" },
          },
        ]}
      />,
    );
    expect(screen.getByText("₱12.35")).toBeTruthy();
  });
});
