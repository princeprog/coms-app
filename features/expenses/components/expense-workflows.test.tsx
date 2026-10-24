// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseVoid } from "./expense-void";
import { ExpenseCategories } from "./expense-categories";
import { ExpenseFilters } from "./expense-filters";
import { ExpenseEditor } from "./expense-editor";
import { category, expense, location } from "../test-fixtures";
import { defaultExpenseQuery, expenseHref } from "../services/expense-query";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  close: vi.fn(),
  actions: {
    getExpenseCategoriesAction: vi.fn(),
    getExpenseLocationsAction: vi.fn(),
    saveExpenseCategoryAction: vi.fn(),
    saveExpenseAction: vi.fn(),
    voidExpenseAction: vi.fn(),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock("../services/expense-actions", () => mocks.actions);
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
function provider(client: QueryClient, content: React.ReactNode) {
  return <QueryClientProvider client={client}>{content}</QueryClientProvider>;
}
function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
function SearchFilters() {
  const query = { ...defaultExpenseQuery(), search: "rent" };
  const directory = useDirectoryQuery(query, expenseHref);
  return (
    <ExpenseFilters
      query={query}
      directory={directory}
      locations={[location]}
      categories={[category]}
    />
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  mocks.actions.getExpenseCategoriesAction.mockResolvedValue({
    ok: true,
    data: { items: [category] },
  });
  mocks.actions.getExpenseLocationsAction.mockResolvedValue({
    ok: true,
    data: { items: [location] },
  });
});
describe("expense workflow safeguards", () => {
  it("creates from named location/category choices with exact money and no correction fields", async () => {
    const user = userEvent.setup();
    mocks.actions.saveExpenseAction.mockResolvedValue({
      ok: true,
      data: { record: expense, history: [] },
    });
    render(
      provider(client(), <ExpenseEditor canReadShifts onClose={mocks.close} />),
    );
    await screen.findByLabelText("Description");
    await user.click(screen.getByRole("button", { name: "Record expense" }));
    expect(mocks.actions.saveExpenseAction).not.toHaveBeenCalled();
    expect(await screen.findByText("Enter a description.")).toBeTruthy();
    await user.click(screen.getByLabelText("Location"));
    await user.click(await screen.findByRole("option", { name: "Banilad" }));
    await user.click(screen.getByLabelText("Category"));
    await user.click(await screen.findByRole("option", { name: "Utilities" }));
    await user.type(screen.getByLabelText("Description"), "Water bill");
    await user.type(screen.getByLabelText("Amount (PHP)"), "19.95");
    await user.click(screen.getByRole("button", { name: "Record expense" }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    const [id, payload, key] = mocks.actions.saveExpenseAction.mock.calls[0];
    expect(id).toBeUndefined();
    expect(payload).toMatchObject({
      description: "Water bill",
      amount: "19.95",
      category_id: category.id,
      branch_id: location.branch_id,
      cash_source: "OTHER",
    });
    expect(payload).not.toHaveProperty("revision");
    expect(payload).not.toHaveProperty("reason");
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("requires a void reason and keeps the same revision and key on a matching retry", async () => {
    const user = userEvent.setup();
    mocks.actions.voidExpenseAction
      .mockResolvedValueOnce({
        ok: false,
        error: "Conflict. Reload this expense.",
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { record: { ...expense, status: "VOIDED" }, history: [] },
      });
    render(
      provider(
        client(),
        <ExpenseVoid record={expense} onClose={mocks.close} />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Void expense" }));
    expect(mocks.actions.voidExpenseAction).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Reason for voiding"),
      "Duplicate invoice",
    );
    await user.click(screen.getByRole("button", { name: "Void expense" }));
    await screen.findByText("Conflict. Reload this expense.");
    expect(screen.getByLabelText("Reason for voiding")).toHaveProperty(
      "value",
      "Duplicate invoice",
    );
    const first = mocks.actions.voidExpenseAction.mock.calls[0];
    expect(first[1]).toEqual({ revision: 2, reason: "Duplicate invoice" });
    await user.click(screen.getByRole("button", { name: "Void expense" }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    expect(mocks.actions.voidExpenseAction.mock.calls[1]).toEqual(first);
  });
  it("requires confirmation before category deactivation", async () => {
    const user = userEvent.setup();
    mocks.actions.saveExpenseCategoryAction.mockResolvedValue({
      ok: true,
      data: { ...category, is_active: false },
    });
    render(provider(client(), <ExpenseCategories />));
    (
      await screen.findByRole("button", { name: "Actions for Utilities" })
    ).focus();
    await user.keyboard("{Enter}");
    await user.click(
      await screen.findByRole("menuitem", { name: "Deactivate category" }),
    );
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(mocks.actions.saveExpenseCategoryAction).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Deactivate category" }),
    );
    await waitFor(() =>
      expect(mocks.actions.saveExpenseCategoryAction).toHaveBeenCalledWith(
        category.id,
        { is_active: false },
      ),
    );
  });
  it("preserves a category name after duplicate rejection", async () => {
    const user = userEvent.setup();
    mocks.actions.saveExpenseCategoryAction.mockResolvedValue({
      ok: false,
      error: "A category with this name already exists.",
    });
    render(provider(client(), <ExpenseCategories />));
    await screen.findByText("Utilities");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await user.type(screen.getByLabelText("Category name"), "Utilities");
    await user.click(screen.getByRole("button", { name: "Save category" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "A category with this name already exists.",
    );
    expect(screen.getByLabelText("Category name")).toHaveProperty(
      "value",
      "Utilities",
    );
  });
  it("clears the visible search draft when resetting filters", async () => {
    const user = userEvent.setup();
    render(<SearchFilters />);
    expect(screen.getByLabelText("Search expenses")).toHaveProperty(
      "value",
      "rent",
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByLabelText("Search expenses")).toHaveProperty(
      "value",
      "",
    );
    expect(mocks.replace.mock.calls.at(-1)?.[0]).not.toContain("search=rent");
  });
  it("keeps the revision captured when editing even if the parent receives a newer record", async () => {
    const user = userEvent.setup();
    const cache = client();
    mocks.actions.saveExpenseAction.mockResolvedValue({
      ok: false,
      error: "Stale revision.",
    });
    const view = render(
      provider(
        cache,
        <ExpenseEditor record={expense} canReadShifts onClose={mocks.close} />,
      ),
    );
    await user.type(await screen.findByLabelText("Description"), " corrected");
    view.rerender(
      provider(
        cache,
        <ExpenseEditor
          record={{ ...expense, revision: 3 }}
          canReadShifts
          onClose={mocks.close}
        />,
      ),
    );
    await user.type(
      screen.getByLabelText("Reason for correction"),
      "Invoice correction",
    );
    await user.click(screen.getByRole("button", { name: "Save correction" }));
    await waitFor(() =>
      expect(mocks.actions.saveExpenseAction).toHaveBeenCalled(),
    );
    expect(mocks.actions.saveExpenseAction.mock.calls[0][1]).toMatchObject({
      revision: 2,
      description: "Electricity bill corrected",
    });
  });
});
