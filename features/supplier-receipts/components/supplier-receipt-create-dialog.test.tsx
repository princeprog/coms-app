// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierReceiptCreateDialog } from "./supplier-receipt-create-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

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

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    expect(screen.getByRole("dialog").getAttribute("data-coms-ui")).toBe(
      "operational",
    );
    expect(screen.getByRole("dialog").getAttribute("data-slot")).toBe(
      "dialog-content",
    );
    expect(
      screen
        .getByRole("combobox", { name: "Supplier" })
        .getAttribute("data-slot"),
    ).toBe("select-trigger");
    expect(
      screen
        .getByRole("combobox", { name: "Stock item for line 1" })
        .getAttribute("data-slot"),
    ).toBe("select-trigger");
    await selectDeliveryDate(user);
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "1.25",
    );
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");

    await user.click(screen.getByRole("button", { name: "Review delivery" }));
    expect(screen.getByText("Review supplier delivery")).toBeTruthy();
    expect(
      screen.getByText(/This immediately increases commissary inventory/),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Record delivery" }));
    await screen.findByText("Temporary failure.");
    await user.click(screen.getByRole("button", { name: "Review delivery" }));
    await user.click(screen.getByRole("button", { name: "Record delivery" }));
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
    await user.click(screen.getByRole("button", { name: "Review delivery" }));
    await user.click(screen.getByRole("button", { name: "Record delivery" }));
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

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    await selectDeliveryDate(user);
    await user.type(screen.getByLabelText("Quantity received for line 1"), "0");
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");
    await user.click(screen.getByRole("button", { name: "Review delivery" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });

  it("confirms before discarding unsaved delivery details", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    await selectDeliveryDate(user);
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "2.75",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard delivery details?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("button", { name: /Delivery date: September 24/ }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Quantity received for line 1"),
    ).toHaveProperty("value", "2.75");
  });

  it("routes Escape on a dirty delivery through the discard guard", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    await selectDeliveryDate(user);
    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("alertdialog", { name: "Discard delivery details?" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByRole("dialog", { name: "Record supplier delivery" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Delivery date: September 24/ }),
    ).toBeTruthy();
  });
  it("closes a clean modal with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Record supplier delivery",
    });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps a dirty modal open behind its close confirmation and resets after discard", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Record supplier delivery",
    });
    await selectDeliveryDate(user);
    await user.click(
      screen.getByRole("button", { name: "Close Record supplier delivery" }),
    );

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(
      document.querySelector(
        '[data-slot="dialog-content"][data-nested-dialog-open]',
      ),
    ).toBe(dialog);
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    expect(
      screen.getByRole("button", { name: "Delivery date: Select a date" }),
    ).toBeTruthy();
  });

  it("closes the review confirmation without closing the modal", async () => {
    const user = userEvent.setup();
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    await selectDeliveryDate(user);
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "1.25",
    );
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");
    await user.click(screen.getByRole("button", { name: "Review delivery" }));
    await user.click(screen.getByRole("button", { name: "Back to delivery" }));

    expect(
      screen.getByRole("dialog", { name: "Record supplier delivery" }),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Quantity received for line 1"),
    ).toHaveProperty("value", "1.25");
  });

  it("blocks modal dismissal while a delivery is recording", async () => {
    const user = userEvent.setup();
    let resolveAction: (value: {
      ok: true;
      receipt_id: string;
    }) => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<{ ok: true; receipt_id: string }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(
      <SupplierReceiptCreateDialog
        suppliers={[supplier]}
        stockItems={[stockItem]}
        action={action}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Record supplier delivery" }),
    );
    await selectDeliveryDate(user);
    await user.type(
      screen.getByLabelText("Quantity received for line 1"),
      "1.25",
    );
    await user.type(screen.getByLabelText("Unit cost for line 1"), "2.50");
    await user.click(screen.getByRole("button", { name: "Review delivery" }));
    await user.click(screen.getByRole("button", { name: "Record delivery" }));

    const closeButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Close Record supplier delivery"]',
    );
    expect(closeButton?.disabled).toBe(true);
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("alertdialog", { name: "Review supplier delivery" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Recording…" })).toHaveProperty(
      "disabled",
      true,
    );

    resolveAction({ ok: true, receipt_id: id });
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/receipts/${id}`));
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
