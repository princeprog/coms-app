// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authTestSessionUser } from "@/test/auth-fixtures";
import { ExpensesWorkspace } from "./expenses-workspace";
import { ExpenseEditor } from "./expense-editor";
import { defaultExpenseQuery } from "../services/expense-query";
import {
  category,
  expense,
  expensePage,
  ids,
  location,
} from "../test-fixtures";
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  close: vi.fn(),
  actions: {
    listExpensesAction: vi.fn(),
    getExpenseAction: vi.fn(),
    getExpenseCategoriesAction: vi.fn(),
    getExpenseLocationsAction: vi.fn(),
    getExpenseCashOutsAction: vi.fn(),
    saveExpenseAction: vi.fn(),
    voidExpenseAction: vi.fn(),
    saveExpenseCategoryAction: vi.fn(),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock("../services/expense-actions", () => mocks.actions);
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
function mount(content: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {content}
    </QueryClientProvider>,
  );
}
function workspace(permissions = ["expenses.read"]) {
  return mount(
    <ExpensesWorkspace
      user={{ ...authTestSessionUser, permissions }}
      query={defaultExpenseQuery()}
    />,
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
  mocks.actions.listExpensesAction.mockResolvedValue({
    ok: true,
    data: expensePage,
  });
  mocks.actions.getExpenseCategoriesAction.mockResolvedValue({
    ok: true,
    data: { items: [category] },
  });
  mocks.actions.getExpenseLocationsAction.mockResolvedValue({
    ok: true,
    data: { items: [location] },
  });
  mocks.actions.getExpenseAction.mockResolvedValue({
    ok: true,
    data: { record: expense, history: [] },
  });
  mocks.actions.getExpenseCashOutsAction.mockResolvedValue({
    ok: true,
    data: { items: [], total: 0, page: 1, page_size: 10 },
  });
});
describe("Expenses workspace", () => {
  it("clamps a settled out-of-range page while preserving its filters", async () => {
    mocks.actions.listExpensesAction.mockResolvedValue({
      ok: true,
      data: { ...expensePage, items: [], total: 10, page: 2 },
    });
    mount(
      <ExpensesWorkspace
        user={{ ...authTestSessionUser, permissions: ["expenses.read"] }}
        query={{
          ...defaultExpenseQuery(),
          page: 2,
          scope: "COMMISSARY",
          category_id: ids.category,
          search: "rent",
          status: "all",
        }}
      />,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    const target = new URL(
      mocks.replace.mock.calls.at(-1)![0],
      "http://localhost",
    ).searchParams;
    expect(target.get("page")).toBe("1");
    expect(target.get("scope")).toBe("COMMISSARY");
    expect(target.get("category_id")).toBe(ids.category);
    expect(target.get("search")).toBe("rent");
    expect(target.get("status")).toBe("all");
    expect(mocks.replace).toHaveBeenCalledOnce();
  });
  it("shares the intended filter URL with pagination before server navigation completes", async () => {
    const user = userEvent.setup();
    mocks.actions.listExpensesAction.mockResolvedValue({
      ok: true,
      data: { ...expensePage, total: 30 },
    });
    mocks.actions.getExpenseLocationsAction.mockResolvedValue({
      ok: true,
      data: {
        items: [
          location,
          {
            scope: "COMMISSARY",
            branch_id: null,
            name: "Commissary",
            is_active: true,
          },
        ],
      },
    });
    workspace(["expenses.read", "expenses.commissary_read"]);
    await screen.findByText("Electricity bill");
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.click(await screen.findByLabelText("Location"));
    await user.click(await screen.findByRole("option", { name: "Commissary" }));
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    const target = new URL(
      mocks.replace.mock.calls.at(-1)![0],
      "http://localhost",
    ).searchParams;
    expect(target.get("scope")).toBe("COMMISSARY");
    expect(target.get("page")).toBe("2");
  });
  it("omits location filtering and breakdown for branch-only users", async () => {
    const user = userEvent.setup();
    workspace();
    await screen.findByText("Electricity bill");
    expect(screen.queryByText("By location")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Filters" }));
    expect(await screen.findByLabelText("Status")).toBeTruthy();
    expect(screen.queryByLabelText("Location")).toBeNull();
    expect(screen.getByLabelText("Category")).toBeTruthy();
    expect(screen.getByLabelText("Source")).toBeTruthy();
  });
  it("renders server totals and hides mutation and category controls for read-only users", async () => {
    workspace();
    expect(await screen.findByText("Electricity bill")).toBeTruthy();
    expect(screen.getAllByText("₱1,234.56").length).toBeGreaterThan(1);
    expect(screen.queryByRole("button", { name: "Record expense" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Manage categories" }),
    ).toBeNull();
    screen
      .getByRole("button", { name: "Actions for Electricity bill" })
      .focus();
    await userEvent.keyboard("{Enter}");
    expect(
      await screen.findByRole("menuitem", { name: "View details & history" }),
    ).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Edit expense" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Void expense" })).toBeNull();
  });
  it("keeps imported purchases read-only even with mutation grants", async () => {
    mocks.actions.listExpensesAction.mockResolvedValue({
      ok: true,
      data: {
        ...expensePage,
        items: [{ ...expense, source: "DIRECT_PURCHASE" }],
      },
    });
    workspace([
      "expenses.read",
      "expenses.create",
      "expenses.update",
      "expenses.void",
      "costs.read",
    ]);
    (
      await screen.findByRole("button", {
        name: "Actions for Electricity bill",
      })
    ).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menuitem", { name: "View details & history" });
    expect(screen.queryByRole("menuitem", { name: "Edit expense" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Void expense" })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Product & stock costs" })
        .getAttribute("href"),
    ).toBe("/costs");
  });
  it("offers retry without pretending an error is an empty list", async () => {
    mocks.actions.listExpensesAction.mockResolvedValueOnce({
      ok: false,
      error: "Expenses unavailable.",
    });
    workspace();
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Expenses unavailable."),
    );
    expect(screen.queryByText("No expenses in this selection")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Electricity bill")).toBeTruthy();
  });
  it("debounces server search and resets pagination in the URL", async () => {
    workspace();
    await userEvent.type(screen.getByLabelText("Search expenses"), "rent");
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        expect.stringContaining("search=rent"),
        { scroll: false },
      ),
    );
    expect(mocks.replace.mock.calls.at(-1)?.[0]).toContain("page=1");
  });
});
describe("expense correction dialog", () => {
  it("preserves draft, revision and retry key after failure, then closes on success", async () => {
    mocks.actions.saveExpenseAction
      .mockResolvedValueOnce({ ok: false, error: "Network unavailable." })
      .mockResolvedValueOnce({
        ok: true,
        data: { record: expense, history: [] },
      });
    const user = userEvent.setup();
    mount(
      <ExpenseEditor record={expense} canReadShifts onClose={mocks.close} />,
    );
    const description = await screen.findByLabelText("Description");
    await user.clear(description);
    await user.type(description, "Corrected electricity bill");
    await user.type(
      screen.getByLabelText("Reason for correction"),
      "Invoice corrected",
    );
    await user.click(screen.getByRole("button", { name: "Save correction" }));
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      expect.stringContaining("Network unavailable."),
    );
    expect(description).toHaveProperty("value", "Corrected electricity bill");
    const first = mocks.actions.saveExpenseAction.mock.calls[0];
    expect(first[1]).toMatchObject({
      revision: 2,
      amount: "1234.56",
      reason: "Invoice corrected",
    });
    await user.click(screen.getByRole("button", { name: "Save correction" }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    expect(mocks.actions.saveExpenseAction.mock.calls[1]).toEqual(first);
  });
  it("locks linked fields but allows historical category correction", async () => {
    mocks.actions.getExpenseCategoriesAction.mockResolvedValue({
      ok: true,
      data: { items: [{ ...category, is_active: false }] },
    });
    mount(
      <ExpenseEditor
        record={{
          ...expense,
          cash_source: "REGISTER",
          cash_movement_id: ids.cash,
        }}
        canReadShifts={false}
        onClose={mocks.close}
      />,
    );
    expect(await screen.findByLabelText("Amount (PHP)")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByLabelText("Location")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Payment method")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByLabelText("Category").textContent).toContain(
      "Utilities (inactive)",
    );
    expect(screen.queryByLabelText("Find cash out")).toBeNull();
  });
  it("protects dirty drafts and leaves them intact when choosing Keep editing", async () => {
    const user = userEvent.setup();
    mount(
      <ExpenseEditor record={expense} canReadShifts onClose={mocks.close} />,
    );
    await user.type(await screen.findByLabelText("Description"), " corrected");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const confirm = screen.getByRole("alertdialog");
    await user.click(
      within(confirm).getByRole("button", { name: "Keep editing" }),
    );
    expect(screen.getByLabelText("Description")).toHaveProperty(
      "value",
      "Electricity bill corrected",
    );
    expect(mocks.close).not.toHaveBeenCalled();
  });
  it("uses the selected cash-out amount without another register mutation", async () => {
    mocks.actions.getExpenseCashOutsAction.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: ids.cash,
            shift_id: ids.expense,
            shift_number: 7,
            business_date: "2026-01-10",
            amount: "42.10",
            reason: "Electricity",
            actor_name: "Manager",
            created_at: expense.created_at,
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
      },
    });
    const user = userEvent.setup();
    mount(
      <ExpenseEditor record={expense} canReadShifts onClose={mocks.close} />,
    );
    await user.click(await screen.findByLabelText("Cash source"));
    await user.click(screen.getByRole("option", { name: "Register cash out" }));
    await user.click(
      await screen.findByRole("button", { name: /Electricity Shift 7/ }),
    );
    expect(screen.getByLabelText("Amount (PHP)")).toHaveProperty(
      "value",
      "42.10",
    );
    expect(screen.getByLabelText("Amount (PHP)")).toHaveProperty(
      "disabled",
      true,
    );
    expect(mocks.actions.saveExpenseAction).not.toHaveBeenCalled();
  });
});
