// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryManagement } from "./category-management";
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  status: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
    replace: mocks.replace,
    push: mocks.push,
  }),
}));
vi.mock("../services/product-category-actions", () => ({
  saveProductCategoryAction: mocks.save,
  setProductCategoryActiveAction: mocks.status,
}));
const category = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Meals",
  is_active: true,
  created_at: "2026-10-19T00:00:00.000Z",
  updated_at: "2026-10-19T00:00:00.000Z",
};
function mount(active = true) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <CategoryManagement
        page={{
          items: [{ ...category, is_active: active }],
          total: 31,
          page: 1,
          page_size: 10,
        }}
        filters={{ page: 1, pageSize: 10, search: "", active: "all" }}
      />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe("category management", () => {
  it("validates name-only creation, retains a duplicate-name draft and retries successfully", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Create category" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Create category" }),
    );
    expect(screen.getByText("Enter at least 2 characters.")).toBeTruthy();
    expect(mocks.save).not.toHaveBeenCalled();
    mocks.save
      .mockResolvedValueOnce({
        ok: false,
        error: "A category with this name already exists.",
      })
      .mockResolvedValueOnce({ ok: true, data: category });
    const input = within(dialog).getByLabelText(/Name/);
    await user.type(input, "  Meals  ");
    await user.click(
      within(dialog).getByRole("button", { name: "Create category" }),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "A category with this name already exists.",
    );
    expect(input).toHaveProperty("value", "  Meals  ");
    expect(within(dialog).queryByRole("combobox")).toBeNull();
    await user.click(
      within(dialog).getByRole("button", { name: "Create category" }),
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.save).toHaveBeenLastCalledWith(undefined, { name: "Meals" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("guards dirty edit cancellation and preserves the name while keeping editing", async () => {
    const user = userEvent.setup();
    mount();
    screen.getByRole("button", { name: "More actions for Meals" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    await user.type(screen.getByLabelText(/Name/), " and drinks");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText(/Name/)).toHaveProperty(
      "value",
      "Meals and drinks",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("explains archive blocking, displays the conflict and allows retry without closing", async () => {
    const user = userEvent.setup();
    mount();
    mocks.status
      .mockResolvedValueOnce({
        ok: false,
        error: "2 active products still use Meals.",
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...category, is_active: false },
      });
    screen.getByRole("button", { name: "More actions for Meals" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    expect(screen.getByText(/Move any active products/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Archive category" }));
    expect(
      await screen.findByText("2 active products still use Meals."),
    ).toBeTruthy();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Archive category" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.status).toHaveBeenLastCalledWith(category.id, false);
  });
  it("reactivates through a named row action", async () => {
    const user = userEvent.setup();
    mount(false);
    mocks.status.mockResolvedValue({ ok: true, data: category });
    screen.getByRole("button", { name: "More actions for Meals" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "Reactivate" }));
    await user.click(
      screen.getByRole("button", { name: "Reactivate category" }),
    );
    await waitFor(() =>
      expect(mocks.status).toHaveBeenCalledWith(category.id, true),
    );
  });
  it("uses server filter URLs and offers 10, 30 and 50 row pagination", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(
      screen.getByRole("searchbox", { name: "Search categories" }),
      "drinks",
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/products/categories?search=drinks",
        { scroll: false },
      ),
    );
    expect(
      screen.getByRole("link", { name: "Next page" }).getAttribute("href"),
    ).toBe("/products/categories?page=2");
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(screen.getByRole("option", { name: "Archived" }));
    expect(mocks.replace).toHaveBeenLastCalledWith(
      "/products/categories?search=drinks&is_active=false",
      { scroll: false },
    );
    await user.click(screen.getByRole("combobox", { name: "Rows per page" }));
    for (const size of ["10", "30", "50"])
      expect(screen.getByRole("option", { name: size })).toBeTruthy();
    await user.click(screen.getByRole("option", { name: "30" }));
    expect(mocks.replace).toHaveBeenLastCalledWith(
      "/products/categories?page_size=30",
      { scroll: false },
    );
  });
});
