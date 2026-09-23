// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SupplierReceiptDetailView } from "./supplier-receipt-detail-view";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const receipt = {
  id,
  supplier_id: id,
  supplier_name: "North Farm Supply",
  received_at: "2026-09-24",
  status: "DRAFT" as const,
  idempotency_key: "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  created_by_user_id: id,
  posted_by_user_id: null,
  posted_at: null,
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
  it("shows draft details and requires confirmation before posting", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true });
    render(
      <SupplierReceiptDetailView
        receipt={receipt}
        canPost
        postAction={action}
      />,
    );

    expect(screen.getByText("North Farm Supply")).toBeTruthy();
    expect(screen.getByText("12.5 kg")).toBeTruthy();
    expect(screen.getAllByText("31.25")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Post receipt" }));
    expect(screen.getByText("Post this receipt to inventory?")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm posting" }));
    await screen.findByText("Supplier receipt posted.");
    expect(action).toHaveBeenCalledWith(id);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not render a posting control for a posted receipt", () => {
    render(
      <SupplierReceiptDetailView
        receipt={{
          ...receipt,
          status: "POSTED",
          posted_by_user_id: id,
          posted_at: "2026-09-24T02:00:00.000Z",
        }}
        canPost
        postAction={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Post receipt" })).toBeNull();
    expect(screen.getByText("POSTED")).toBeTruthy();
  });
});
