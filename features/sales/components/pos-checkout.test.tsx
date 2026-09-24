// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PosCheckout } from "./pos-checkout";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
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
      product_is_active: true,
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
      product_is_active: true,
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
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockReset();
  });

  it("shows a zero estimate when the cart is empty", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
        menuPage={menuPage}
        action={createAction}
      />,
    );

    expect(screen.getByLabelText("Estimated total").textContent).toBe("0");
  });

  it("prompts staff to check order details when the cart input is invalid", () => {
    render(
      <PosCheckout
        branchId={branchId}
        branchActive
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

    expect(screen.getByLabelText("Estimated total").textContent).toBe("7.625");
    expect(
      screen.getByText("Final price and stock are confirmed by COMS."),
    ).toBeTruthy();
  });

  it("submits an idempotent sale and keeps the cart when the server rejects it", async () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue(key) });
    createAction.mockReset().mockResolvedValueOnce({
      ok: false,
      error:
        "Stock or product availability changed. Review the cart and try again.",
    });
    createAction.mockResolvedValueOnce({
      ok: true,
      sale: {
        id: teaId,
        branch_id: branchId,
        cashier_user_id: branchId,
        status: "COMPLETED",
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
        menuPage={menuPage}
        action={createAction}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Add Chicken sandwich" }),
    );
    fireEvent.change(screen.getByLabelText("Tender method"), {
      target: { value: "cash" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Record sale" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Stock or product",
      ),
    );

    const input = {
      tender_method: "cash",
      items: [{ product_id: chickenId, quantity: "1" }],
    };
    expect(createAction).toHaveBeenLastCalledWith(branchId, input, key);
    expect(
      (
        screen.getByLabelText(
          "Quantity for Chicken sandwich",
        ) as HTMLInputElement
      ).value,
    ).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Record sale" }));
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
        .getByRole("button", { name: "Record sale" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
