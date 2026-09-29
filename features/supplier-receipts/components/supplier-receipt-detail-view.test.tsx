// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupplierReceiptDetailView } from "./supplier-receipt-detail-view";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const receipt = {
  id,
  supplier_id: id,
  supplier_name: "North Farm Supply",
  received_at: "2026-09-24",
  idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  recorded_by_user_id: id,
  recorded_by_name: "Alex Manager",
  recorded_at: "2026-09-24T02:00:00.000Z",
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
  total_cost: "31.25",
  items: [
    {
      id,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_received: "12.5",
      unit_cost: "2.50",
      line_total: "31.25",
    },
  ],
};

describe("supplier receipt detail view", () => {
  it("shows immutable delivery, inventory cost, and recording audit details", () => {
    render(<SupplierReceiptDetailView receipt={receipt} />);

    expect(screen.getByText("North Farm Supply")).toBeTruthy();
    expect(screen.getByText("12.5 kg")).toBeTruthy();
    expect(screen.getByText("Alex Manager")).toBeTruthy();
    expect(screen.getAllByText("31.25")).toHaveLength(3);
    expect(screen.getByText("Recorded at")).toBeTruthy();
    expect(screen.getByText("Sep 24, 2026, 10:00 AM")).toBeTruthy();
    expect(
      screen
        .getByRole("region", { name: "Receipt items table" })
        .getAttribute("data-slot"),
    ).toBe("table-container");
    expect(screen.queryByRole("button", { name: /post receipt/i })).toBeNull();
    expect(screen.queryByText("POSTED")).toBeNull();
  });
});
