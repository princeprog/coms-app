import { render } from "@/test/pos-render";
// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/features/sales/services/sales-price-actions", () => ({
  refreshCartPricesAction: vi.fn(),
}));
import { PosCheckout } from "./pos-checkout";
import { refreshCartPricesAction } from "../services/sales-price-actions";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const branchId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const chickenId = "3fa85f64-5717-4562-b3fc-2c963f66afa7";
const teaId = "3fa85f64-5717-4562-b3fc-2c963f66afa8";
const key = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const menuPage = {
  items: [
    {
      branch_id: branchId,
      branch_name: "Downtown",
      product_id: chickenId,
      product_name: "Chicken sandwich",
      description: "Grilled chicken and greens",
      category_id: "aa000000-0000-4000-8000-000000000001",
      category_name: "Rice meals",
      category_is_active: true,
      product_is_active: true,
      price_revision: 1,
      price: "9.2500",
      is_available: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      branch_id: branchId,
      branch_name: "Downtown",
      product_id: teaId,
      product_name: "Iced tea",
      description: null,
      category_id: "aa000000-0000-4000-8000-000000000001",
      category_name: "Rice meals",
      category_is_active: true,
      product_is_active: true,
      price_revision: 1,
      price: "3.00",
      is_available: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ],
  total: 2,
  page: 1,
  page_size: 25,
};

const createAction = vi.fn();

describe("POS checkout", () => {
  it("requires a service choice and preserves quantities when a changed service makes an item incompatible", () => {
    const singleMenu = {
      ...menuPage,
      items: [
        {
          ...menuPage.items[0],
          available_service_types: ["TAKEAWAY" as const],
        },
      ],
    };
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        menuPage={singleMenu}
        action={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    ).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Takeout" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.change(screen.getByLabelText("Quantity for Chicken sandwich"), {
      target: { value: "2.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Dine-in" }));
    expect(
      screen.getByLabelText("Quantity for Chicken sandwich"),
    ).toHaveProperty("value", "2.5");
    expect(screen.getByRole("alert").textContent).toContain("incompatible");
    expect(
      screen.getByRole("button", { name: "Complete sale" }),
    ).toHaveProperty("disabled", true);
  });
  it("requires explicit price review after a revision conflict and sends the new revision with a new retry key", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: false,
      error: "Prices changed",
      code: "PRICE_CHANGED",
    });
    vi.mocked(refreshCartPricesAction).mockResolvedValue({
      ok: true,
      items: menuPage.items.map((item) => ({
        ...item,
        price: "10.5",
        price_revision: 2,
      })),
    });
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={action}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
    await screen.findByText("Review updated prices");
    const accept = await screen.findByRole("button", {
      name: "Accept updated prices",
    });
    await waitFor(() => expect(accept).toHaveProperty("disabled", false));
    expect(
      screen.getByRole("button", { name: "Complete sale" }),
    ).toHaveProperty("disabled", true);
    expect(action).toHaveBeenCalledTimes(1);
    fireEvent.click(accept);
    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action.mock.calls[0][1].items[0].price_revision).toBe(1);
    expect(action.mock.calls[1][1].items[0].price_revision).toBe(2);
    expect(action.mock.calls[0][2]).not.toBe(action.mock.calls[1][2]);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("shows a zero estimate when the cart is empty", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={createAction}
      />,
    );

    expect(screen.getByLabelText("Estimated total").textContent).toBe("₱0.00");
  });

  it("offers a direct cart anchor after adding the first item", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={createAction}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );

    expect(
      screen
        .getByRole("link", { name: "View cart (1 item)" })
        .getAttribute("href"),
    ).toBe("#pos-cart-panel");
  });

  it("prompts staff to check order details when the cart input is invalid", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={createAction}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.change(screen.getByLabelText("Quantity for Chicken sandwich"), {
      target: { value: "0" },
    });

    expect(screen.getByLabelText("Estimated total").textContent).toBe(
      "Check the order details",
    );
  });

  it("builds a cart and estimates totals with exact decimal arithmetic", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={createAction}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Iced tea" }));
    fireEvent.change(screen.getByLabelText("Quantity for Chicken sandwich"), {
      target: { value: "0.5" },
    });

    expect(screen.getByLabelText("Estimated total").textContent).toBe("₱7.625");
  });

  it("submits an idempotent sale and keeps the cart when the server rejects it", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(key) });
    createAction.mockReset().mockResolvedValueOnce({
      ok: false,
      error: "Product availability changed. Review the cart and try again.",
    });
    createAction.mockResolvedValueOnce({
      ok: true,
      sale: {
        id: teaId,
        branch_id: branchId,
        cashier_user_id: branchId,
        status: "COMPLETED",
        service_type: "TAKEAWAY",
        tender_method: "cash",
        total_amount: "9.25",
        idempotency_key: key,
        created_at: timestamp,
        items: [],
        events: [],
      },
    });
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={createAction}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );

    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Product availability",
      ),
    );

    const input = {
      service_type: "TAKEAWAY",
      tender_method: "Cash",
      payment_method_id: "a34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
      items: [{ product_id: chickenId, price_revision: 1, quantity: "1" }],
    };
    expect(createAction).toHaveBeenLastCalledWith(branchId, input, key);
    expect(
      (
        screen.getByLabelText(
          "Quantity for Chicken sandwich",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");

    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
    await waitFor(() =>
      expect(
        screen.getByText("Sale recorded. Confirmed total: 9.25"),
      ).toBeTruthy(),
    );
    expect(createAction).toHaveBeenNthCalledWith(2, branchId, input, key);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("disables checkout for inactive branches and blocks invalid quantities", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive={false}
        menuPage={menuPage}
        action={createAction}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Complete sale" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("blocks underpayment including direct form submission and recalculates cash as quantities change", () => {
    const action = vi.fn();
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={action}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    const pay = screen.getByRole("button", { name: "Complete sale" });
    expect(pay).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "5" },
    });
    expect(screen.getByText("Amount received is short by ₱4.25.")).toBeTruthy();
    fireEvent.submit(screen.getByRole("form", { name: "POS checkout" }));
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Exact amount" }));
    expect(screen.getByLabelText("Change due").textContent).toBe("₱0.00");
    expect(pay).toHaveProperty("disabled", false);
    fireEvent.click(
      screen.getByRole("button", { name: "Increase Chicken sandwich" }),
    );
    expect(pay).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "₱1,000.00" }));
    expect(screen.getByLabelText("Change due").textContent).toBe("₱981.50");
  });

  it("retains confirmed change after success and clears cash for the next order", async () => {
    const action = vi.fn().mockResolvedValue({
      ok: true,
      sale: { id: teaId, status: "COMPLETED", total_amount: "9.25" },
    });
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={action}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.change(screen.getByLabelText("Amount received"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
    await screen.findByText("Sale recorded. Confirmed total: 9.25");
    expect(screen.getByLabelText("Change due").textContent).toBe("₱0.75");
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "10",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Iced tea" }));
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "",
    );
    expect(screen.getByLabelText("Change due").textContent).toBe("—");
    expect(
      screen.getByRole("button", { name: "Complete sale" }),
    ).toHaveProperty("disabled", true);
  });

  it("requires confirmation to clear an order and resets its payment", async () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menuPage}
        action={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Iced tea" }));
    fireEvent.click(screen.getByRole("button", { name: "Exact amount" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep order" }));
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "12.25",
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(await screen.findByRole("button", { name: "Clear order" }));
    expect(screen.queryByLabelText("Quantity for Chicken sandwich")).toBeNull();
    expect(screen.getByLabelText("Amount received")).toHaveProperty(
      "value",
      "",
    );
  });
});
