// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierReceiptCreateDialog } from "./supplier-receipt-create-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const otherId = "7fa85f64-5717-4562-b3fc-2c963f66afa6";
const supplier = {
  id,
  supplier_name: "North Farm Supply",
  contact_person: null,
  contact_number: null,
  email: null,
  address: null,
  is_active: true,
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
};
const stockItem = {
  id: otherId,
  stock_item_name: "Flour",
  category: "Dry goods",
  unit: "kg",
  is_active: true,
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
};

describe("supplier receipt create dialog", () => {
  beforeEach(() => push.mockClear());

  it("preserves decimal strings, retries with the same key, and changes the key when data changes", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Temporary failure." })
      .mockResolvedValueOnce({ ok: false, error: "Temporary failure." })
      .mockResolvedValueOnce({ ok: true, receipt_id: id });
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create receipt" }));
    await user.type(screen.getByLabelText("Received date"), "2026-09-24");
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "1.25",
    );
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");

    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Temporary failure.");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));

    const firstCall = action.mock.calls[0];
    const secondCall = action.mock.calls[1];
    expect(firstCall[0]).toMatchObject({
      supplier_id: id,
      items: [
        {
          stock_item_id: otherId,
          quantity_received: "1.25",
          unit_cost: "2.50",
        },
      ],
    });
    expect(firstCall[1]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(secondCall[1]).toBe(firstCall[1]);

    const quantity = screen.getByLabelText("Quantity received for line 1");
    await user.clear(quantity);
    await user.type(quantity, "1.50");
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(3));

    expect(action.mock.calls[2][1]).not.toBe(firstCall[1]);
    expect(action.mock.calls[2][0].items[0].quantity_received).toBe("1.50");
    expect(push).toHaveBeenCalledWith(`/receipts/${id}`);
  });

  it("does not submit zero received quantities", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={action}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create receipt" }));
    await user.type(screen.getByLabelText("Received date"), "2026-09-24");
    await user.type(screen.getByLabelText("Quantity received for line 1"), "0");
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });
});
