// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierReceiptCreatePage } from "./supplier-receipt-create-page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const supplierId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const stockItemId = "7fa85f64-5717-4562-b3fc-2c963f66afa6";
const supplier = {
  id: supplierId,
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
  id: stockItemId,
  usage_types: ["INGREDIENT" as const],
  stock_item_name: "Flour",
  category: "Dry goods",
  unit: "kg",
  is_active: true,
  created_at: "2026-09-24T01:30:00.000Z",
  updated_at: "2026-09-24T01:30:00.000Z",
};

describe("supplier receipt create page", () => {
  beforeEach(() => push.mockReset());

  it("provides a dedicated receiving workspace with a live exact summary", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreatePage
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Record supplier delivery" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Supplier Receiving" })
        .getAttribute("href"),
    ).toBe("/receipts");
    expect(screen.getByRole("table", { name: "Received items" })).toBeTruthy();
    expect(screen.getByText("Delivery summary")).toBeTruthy();

    await selectDeliveryDate(user);
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "1.25",
    );
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");

    expect(screen.getAllByText("3.125").length).toBeGreaterThan(0);
    expect(screen.getAllByText("North Farm Supply").length).toBeGreaterThan(1);
  });

  it("reviews and records the delivery without losing retry behavior", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({
      ok: true,
      receipt_id: supplierId,
    });
    render(
      <SupplierReceiptCreatePage
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={action}
      />,
    );

    await selectDeliveryDate(user);
    await user.type(screen.getByLabelText("Quantity received for line 1"), "2");
    await user.type(screen.getByLabelText("Unit cost for line 1"), "5.25");
    await user.click(
      screen.getAllByRole("button", { name: "Review delivery" })[0],
    );
    expect(
      screen.getByRole("alertdialog", { name: "Review supplier delivery" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Record delivery" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][0]).toMatchObject({
      supplier_id: supplierId,
      items: [
        {
          stock_item_id: stockItemId,
          quantity_received: "2",
          unit_cost: "5.25",
        },
      ],
    });
    expect(push).toHaveBeenCalledWith(`/receipts/${supplierId}`);
  });
});

async function selectDeliveryDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Delivery date:/ }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: /month/i }),
    "8",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /year/i }),
    "2026",
  );
  await user.click(screen.getByRole("button", { name: /September 24/ }));
}
