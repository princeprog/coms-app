// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { usePosPaymentMethods } from "./use-pos-payment-methods";
import { getAvailablePaymentMethodsAction } from "../services/payment-method-actions";
vi.mock("../services/payment-method-actions", () => ({
  getAvailablePaymentMethodsAction: vi.fn(),
}));
const cash = { id: "cash-id", name: "Counter cash", kind: "CASH" };
const card = { id: "card-id", name: "Card", kind: "NON_CASH" };
beforeEach(() => vi.mocked(getAvailablePaymentMethodsAction).mockReset());
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => usePosPaymentMethods(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
it("defaults by cash type and never silently changes a disabled selection", async () => {
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([
    cash,
    card,
  ] as never);
  const { result } = setup();
  await waitFor(() =>
    expect(result.current.selected?.name).toBe("Counter cash"),
  );
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([
    card,
  ] as never);
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.selected?.id).toBe(cash.id);
  await waitFor(() => expect(result.current.unavailable).toBe(true));
  act(() => result.current.select(card.id));
  expect(result.current.selected?.id).toBe(card.id);
  expect(result.current.unavailable).toBe(false);
});
it("blocks checkout on lookup failure and recovers without discarding selection", async () => {
  vi.mocked(getAvailablePaymentMethodsAction).mockRejectedValue(
    new Error("Offline"),
  );
  const { result } = setup();
  await waitFor(() => expect(result.current.failed).toBe(true));
  expect(result.current.unavailable).toBe(true);
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([
    cash,
  ] as never);
  await act(async () => {
    await result.current.refresh();
  });
  await waitFor(() =>
    expect(result.current.selected?.name).toBe("Counter cash"),
  );
  expect(result.current.unavailable).toBe(false);
});
it("shows an empty configuration without inventing a cash fallback", async () => {
  vi.mocked(getAvailablePaymentMethodsAction).mockResolvedValue([]);
  const { result } = setup();
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.selected).toBeNull();
  expect(result.current.unavailable).toBe(true);
});
