// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupplierReceiptManagement } from "./supplier-receipt-management";

const receiptId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const page = {
  items: [
    {
      id: receiptId,
      supplier_id: receiptId,
      supplier_name: "North Farm Supply",
      received_at: "2026-09-24",
      status: "DRAFT" as const,
      idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
      created_by_user_id: receiptId,
      posted_by_user_id: null,
      posted_at: null,
      created_at: "2026-09-24T01:30:00.000Z",
      updated_at: "2026-09-24T01:30:00.000Z",
      total_cost: "31.25",
      item_count: 2,
    },
  ],
  total: 51,
  page: 2,
  page_size: 25,
};

describe("supplier receipt management", () => {
  it("shows filtered receipt rows and preserves filters in pagination", () => {
    render(
      <SupplierReceiptManagement
        page={page}
        search="North Farm"
        statusFilter="DRAFT"
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("table", { name: "Supplier receipts" }),
    ).toBeTruthy();
    expect(screen.getByText("North Farm Supply")).toBeTruthy();
    expect(screen.getByText("DRAFT")).toBeTruthy();
    expect(screen.getByText("31.25")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "View receipt" }).getAttribute("href"),
    ).toBe(`/receipts/${receiptId}`);
    expect(
      screen.getByRole("link", { name: "Previous page" }).getAttribute("href"),
    ).toBe("/receipts?search=North+Farm&status=DRAFT");
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/receipts?page=3&search=North+Farm&status=DRAFT");
  });

  it("explains when no receipts match the filters", () => {
    render(
      <SupplierReceiptManagement
        page={{ items: [], total: 0, page: 1, page_size: 25 }}
        search="Unknown supplier"
        statusFilter="all"
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No supplier receipts match these filters."),
    ).toBeTruthy();
  });
});
