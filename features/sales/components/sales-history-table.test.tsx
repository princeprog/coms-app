// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesHistoryTable } from "./sales-history-table";

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const saleId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";

describe("sales history table", () => {
  it("shows server snapshots and preserves branch/menu filters in links", () => {
    render(
      <SalesHistoryTable
        page={{
          items: [
            {
              id: saleId,
              branch_id: branchId,
              cashier_user_id: branchId,
              cashier_name: "Mina Cashier",
              status: "COMPLETED",
              tender_method: "cash",
              total_amount: "12.5000",
              idempotency_key: saleId,
              created_at: "2026-09-24T01:30:00.000Z",
            },
          ],
          total: 51,
          page: 2,
          page_size: 25,
        }}
        filters={{
          branchId,
          page: 3,
          historyPage: 2,
          search: "chicken",
        }}
      />,
    );

    expect(screen.getByRole("table", { name: "Sales history" })).toBeTruthy();
    expect(screen.getByText("Mina Cashier")).toBeTruthy();
    expect(screen.getByText("12.5000")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "View sale" }).getAttribute("href"),
    ).toBe(
      `/pos?branch_id=${branchId}&page=3&history_page=2&search=chicken&sale_id=${saleId}`,
    );
    expect(
      screen
        .getByRole("link", { name: "Previous sales page" })
        .getAttribute("href"),
    ).toBe(`/pos?branch_id=${branchId}&page=3&search=chicken`);
    expect(
      screen
        .getByRole("link", { name: "Next sales page" })
        .getAttribute("href"),
    ).toBe(`/pos?branch_id=${branchId}&page=3&history_page=3&search=chicken`);
  });

  it("explains when there are no recorded sales", () => {
    render(
      <SalesHistoryTable
        page={{ items: [], total: 0, page: 1, page_size: 25 }}
        filters={{ branchId, page: 1, historyPage: 1, search: "" }}
      />,
    );
    expect(
      screen.getByText("No sales have been recorded for this branch."),
    ).toBeTruthy();
  });
});
