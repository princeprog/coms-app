// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { useProductSetup } from "./use-product-setup";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("../services/product-setup-actions", () => ({
  saveProductSetupAction: vi.fn(),
}));

it("clears only category validation when an active valid category is selected", async () => {
  const client = new QueryClient();
  const { result } = renderHook(() => useProductSetup(null), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  act(() => {
    result.current.setName("Meal");
    result.current.setPrice("invalid");
    result.current.setCategory({
      id: "invalid",
      name: "Old category",
      is_active: true,
    });
  });
  act(() => result.current.save());
  await waitFor(() =>
    expect(result.current.fieldErrors.category_id).toBeTruthy(),
  );
  const priceError = result.current.fieldErrors.price;
  expect(priceError).toBeTruthy();
  act(() =>
    result.current.setCategory({
      id: "00000000-0000-4000-8000-000000000002",
      name: "Beverages",
      is_active: true,
    }),
  );
  expect(result.current.fieldErrors.category_id).toBeUndefined();
  expect(result.current.fieldErrors.price).toBe(priceError);
  expect(result.current.error).toBe("Check the highlighted product fields.");
});
