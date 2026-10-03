// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDispatchStockSearch } from "./use-dispatch-stock-search";
const { searchDispatchStock } = vi.hoisted(() => ({
  searchDispatchStock: vi.fn(),
}));
vi.mock("../services/dispatch-stock-actions", () => ({ searchDispatchStock }));
const page = (name: string) => ({
  items: [
    { id: name, stock_item_name: name, unit: "kg", quantity_on_hand: null },
  ],
  total: 26,
  page: 1,
  page_size: 25,
  availabilityVisible: false,
});
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useDispatchStockSearch(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
describe("dispatch stock search", () => {
  it("debounces and ignores an obsolete response after search changes", async () => {
    let resolveOld: (value: ReturnType<typeof page>) => void = () => {};
    searchDispatchStock.mockReset().mockImplementation(({ search }) =>
      search === ""
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve(page("Rice")),
    );
    const view = setup();
    await waitFor(() =>
      expect(searchDispatchStock).toHaveBeenCalledWith({ search: "", page: 1 }),
    );
    act(() => view.result.current.setSearch("Rice"));
    expect(view.result.current.data).toBeUndefined();
    await waitFor(() =>
      expect(view.result.current.data?.items[0].stock_item_name).toBe("Rice"),
    );
    await act(async () => resolveOld(page("Old Flour")));
    expect(view.result.current.data?.items[0].stock_item_name).toBe("Rice");
  });
  it("exposes a failed lookup and recovers without inventing zero availability", async () => {
    searchDispatchStock
      .mockReset()
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(page("Flour"));
    const view = setup();
    await waitFor(() => expect(view.result.current.isError).toBe(true));
    expect(view.result.current.data).toBeUndefined();
    await act(async () => {
      await view.result.current.refetch();
    });
    await waitFor(() =>
      expect(view.result.current.data?.items[0].quantity_on_hand).toBeNull(),
    );
  });
});
