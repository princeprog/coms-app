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
      idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
      recorded_by_user_id: receiptId,
      recorded_by_name: "Alex Manager",
      recorded_at: "2026-09-24T01:30:00.000Z",
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
  it("searches final supplier delivery records and preserves search in pagination", () => {
    render(
      <SupplierReceiptManagement
        page={page}
        search="North Farm"
        canCreate={false}
        formOptions={null}
        formOptionsIssue={null}
        createAction={vi.fn()}
      />,
    );

    const form = screen.getByRole("form", { name: "Filter supplier receipts" });
    expect(form.getAttribute("action")).toBe("/receipts");
    expect(form.getAttribute("method")).toBeNull();
    expect(
      (screen.getByLabelText("Search supplier") as HTMLInputElement).value,
    ).toBe("North Farm");
    expect(screen.getByRole("table", { name: "Supplier deliveries" })).toBeTruthy();
    expect(screen.getByText("North Farm Supply")).toBeTruthy();
    expect(screen.getByText("Alex Manager")).toBeTruthy();
    expect(screen.getByText("31.25")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
    expect(
      screen
        .getByRole("region", { name: "Supplier deliveries table" })
        .getAttribute("data-slot"),
    ).toBe("table-container");
    expect(
      screen.getByRole("link", { name: "View delivery" }).getAttribute("href"),
    ).toBe(`/receipts/${receiptId}`);
    expect(
      screen.getByRole("link", { name: "Previous page" }).getAttribute("href"),
    ).toBe("/receipts?search=North+Farm");
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/receipts?page=3&search=North+Farm");
  });

  it("explains when supplier search has no matches", () => {
    render(
      <SupplierReceiptManagement
        page={{ items: [], total: 0, page: 1, page_size: 25 }}
        search="Unknown supplier"
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
