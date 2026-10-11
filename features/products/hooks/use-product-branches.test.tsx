// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useProductBranches } from "./use-product-branches";

vi.mock("../services/product-branch-actions", () => ({
  searchProductBranchesAction: vi.fn().mockResolvedValue({
    ok: true,
    data: { items: [], total: 50, page: 2, page_size: 25 },
  }),
}));

afterEach(() => vi.useRealTimers());

it("keeps the requested page when the branch search has not changed", async () => {
  vi.useFakeTimers();
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(
    () => useProductBranches([], 50, true),
    { wrapper },
  );
  await act(async () => result.current.setPage(2));
  act(() => vi.advanceTimersByTime(350));
  expect(result.current.page).toBe(2);
  unmount();
  client.clear();
});
