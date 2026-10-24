import type { Expense, ExpensePage } from "./schemas/expense.schema";
import { expenseDraft } from "./services/expense-draft";
export const ids = {
  expense: "00000000-0000-4000-8000-000000000001",
  category: "00000000-0000-4000-8000-000000000002",
  branch: "00000000-0000-4000-8000-000000000003",
  cash: "00000000-0000-4000-8000-000000000004",
  key: "00000000-0000-4000-8000-000000000005",
};
export const expense: Expense = {
  id: ids.expense,
  source: "OPERATING",
  expense_date: "2026-01-10",
  scope: "BRANCH",
  branch_id: ids.branch,
  location_name: "Banilad",
  category_id: ids.category,
  category_name: "Utilities",
  description: "Electricity bill",
  amount: "1234.56",
  payment_method: "CASH",
  cash_source: "OTHER",
  cash_movement_id: null,
  payee: "Power company",
  reference: null,
  notes: null,
  status: "RECORDED",
  revision: 2,
  created_by_user_id: ids.expense,
  created_by_name: "Manager",
  created_at: "2026-01-10T03:00:00Z",
  updated_at: "2026-01-10T03:00:00Z",
};
export const input = expenseDraft(expense);
export const category = {
  id: ids.category,
  name: "Utilities",
  is_active: true,
  created_at: expense.created_at,
  updated_at: expense.updated_at,
};
export const location = {
  scope: "BRANCH" as const,
  branch_id: ids.branch,
  name: "Banilad",
  is_active: true,
};
export const expensePage: ExpensePage = {
  items: [expense],
  total: 1,
  page: 1,
  page_size: 10,
  summary: {
    recorded_spending: "1234.56",
    operating_expenses: "1234.56",
    stock_purchases: "0.00",
  },
  by_location: [{ id: ids.branch, name: "Banilad", amount: "1234.56" }],
  by_category: [{ id: ids.category, name: "Utilities", amount: "1234.56" }],
};
