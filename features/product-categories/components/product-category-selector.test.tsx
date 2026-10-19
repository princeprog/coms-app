// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductCategorySelector } from "./product-category-selector";
const { search } = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock("../services/product-category-actions", () => ({
  searchAvailableCategoriesAction: search,
}));
const meal = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Meals",
  is_active: true,
};
const drink = {
  id: "00000000-0000-4000-8000-000000000003",
  name: "Drinks",
  is_active: true,
};
const result = (items: (typeof meal)[], total = items.length, page = 1) => ({
  ok: true,
  data: { items, total, page, page_size: 10 },
});
function mount() {
  const change = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProductCategorySelector
        value={null}
        onChange={change}
        disabled={false}
      />
    </QueryClientProvider>,
  );
  return change;
}
beforeEach(() => {
  search.mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});
describe("active category selector", () => {
  it("offers retry after a lookup failure without selecting anything automatically", async () => {
    const user = userEvent.setup();
    search
      .mockResolvedValueOnce({
        ok: false,
        error: "Category service unavailable.",
      })
      .mockResolvedValueOnce(result([meal, { ...drink, is_active: false }]));
    const change = mount();
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    expect(
      await screen.findByText("Category service unavailable."),
    ).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Retry categories" }));
    expect(await screen.findByRole("option", { name: "Meals" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Drinks" })).toBeNull();
    await user.click(screen.getByRole("option", { name: "Meals" }));
    expect(change).toHaveBeenCalledWith(meal);
  });
  it("paginates on the server, resets search to page one and supports keyboard selection", async () => {
    const user = userEvent.setup();
    search.mockImplementation(async ({ page, search: term }) =>
      term
        ? result([drink])
        : page === 1
          ? result([meal], 11)
          : result([drink], 11, 2),
    );
    const change = mount();
    const trigger = screen.getByRole("combobox", { name: "Category" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("option", { name: "Meals" });
    await user.click(screen.getByRole("button", { name: "Next categories" }));
    await screen.findByRole("option", { name: "Drinks" });
    expect(search).toHaveBeenLastCalledWith({
      page: 2,
      page_size: 10,
      search: "",
    });
    await user.type(
      screen.getByRole("combobox", { name: "Search categories" }),
      "Drink",
    );
    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith({
        page: 1,
        page_size: 10,
        search: "Drink",
      }),
    );
    await screen.findByRole("option", { name: "Drinks" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(change).toHaveBeenCalledWith(drink);
  });
  it("shows a useful empty state", async () => {
    const user = userEvent.setup();
    search.mockResolvedValue(result([]));
    mount();
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    expect(
      await screen.findByText("No active categories available."),
    ).toBeTruthy();
  });
});
