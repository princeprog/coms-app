// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { PosCheckout } from "./pos-checkout";
import { getAvailablePaymentMethodsAction } from "@/features/payment-methods/services/payment-method-actions";
vi.mock("@/features/payment-methods/services/payment-method-actions", () => ({
  getAvailablePaymentMethodsAction: vi.fn(),
}));
vi.mock("@/features/sales/services/sales-price-actions", () => ({
  refreshCartPricesAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const cash = {
  id: "a34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  name: "Counter cash",
  kind: "CASH" as const,
};
const card = {
  id: "b34b9dc6-135f-4bd0-9f25-43a9617c9e0a",
  name: "GCash",
  kind: "NON_CASH" as const,
};
const menu = {
  items: [
    {
      branch_id: id,
      branch_name: "Main",
      product_id: id,
      product_name: "Chicken",
      description: null,
      category_id: "aa000000-0000-4000-8000-000000000001",
      category_name: "Rice meals",
      category_is_active: true,
      product_is_active: true,
      price_revision: 1,
      price: "20",
      is_available: true,
      created_at: "2026-10-12T00:00:00Z",
      updated_at: "2026-10-12T00:00:00Z",
    },
  ],
  total: 1,
  page: 1,
  page_size: 25,
};
function setup(
  action = vi.fn().mockResolvedValue({ ok: false, error: "Try again" }),
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PosCheckout
        branchId={id}
        branchActive
        serviceTypes={["TAKEAWAY"]}
        menuPage={menu}
        action={action}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add Chicken" }));
  return action;
}
beforeEach(() =>
  vi
    .mocked(getAvailablePaymentMethodsAction)
    .mockReset()
    .mockResolvedValue([cash, card]),
);
it("calculates change for renamed cash and sends a selected non-cash method ID without cash entry", async () => {
  const action = setup();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByLabelText("Amount received")).toBeTruthy(),
  );
  expect(
    screen.getByRole("combobox", { name: "Payment method" }).textContent,
  ).toContain("Counter cash");
  expect(screen.getByRole("button", { name: "Complete sale" })).toHaveProperty(
    "disabled",
    true,
  );
  await user.click(screen.getByRole("combobox", { name: "Payment method" }));
  await user.click(screen.getByRole("option", { name: "GCash" }));
  expect(screen.queryByLabelText("Amount received")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Complete sale" }));
  await waitFor(() =>
    expect(action).toHaveBeenCalledWith(
      id,
      expect.objectContaining({
        payment_method_id: card.id,
        tender_method: "GCash",
      }),
      expect.any(String),
    ),
  );
  expect(screen.getByLabelText("Quantity for Chicken")).toHaveProperty(
    "value",
    "1",
  );
});
it("keeps the cart and total when no payment methods are enabled", async () => {
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([]);
  const action = setup();
  await screen.findByText(/No payment methods are enabled/);
  expect(screen.getByLabelText("Estimated total").textContent).toContain(
    "20.00",
  );
  fireEvent.submit(screen.getByRole("form", { name: "POS checkout" }));
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Quantity for Chicken")).toHaveProperty(
    "value",
    "1",
  );
});
it("shows a confirmed non-cash sale without cash received or change", async () => {
  const action = setup(
    vi.fn().mockResolvedValue({
      ok: true,
      sale: {
        id,
        status: "COMPLETED",
        total_amount: "20",
        tender_method: "GCash",
        service_type: "TAKEAWAY",
      },
    }),
  );
  const user = userEvent.setup();
  await screen.findByLabelText("Amount received");
  await user.click(screen.getByRole("combobox", { name: "Payment method" }));
  await user.click(screen.getByRole("option", { name: "GCash" }));
  await user.click(screen.getByRole("button", { name: "Complete sale" }));
  await screen.findByRole("heading", { name: "Sale completed" });
  expect(screen.getByLabelText("Confirmed total").textContent).toBe("₱20.00");
  expect(screen.getByText("GCash")).toBeTruthy();
  expect(screen.queryByLabelText("Amount received")).toBeNull();
  expect(screen.queryByLabelText("Change due")).toBeNull();
  expect(action).toHaveBeenCalledTimes(1);
});
it("refreshes disabled methods after a server conflict without switching tender or losing the order", async () => {
  const action = setup(
    vi.fn().mockResolvedValue({
      ok: false,
      code: "PAYMENT_METHOD_UNAVAILABLE",
      error: "This payment method is no longer accepted.",
    }),
  );
  await screen.findByLabelText("Amount received");
  fireEvent.change(screen.getByLabelText("Amount received"), {
    target: { value: "20" },
  });
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([card]);
  fireEvent.click(screen.getByRole("button", { name: "Complete sale" }));
  await waitFor(() =>
    expect(
      screen.getByRole("combobox", { name: "Payment method" }).textContent,
    ).toContain("unavailable"),
  );
  expect(action).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Quantity for Chicken")).toHaveProperty(
    "value",
    "1",
  );
  expect(screen.getByRole("button", { name: "Complete sale" })).toHaveProperty(
    "disabled",
    true,
  );
});
