import type { Expense } from "../schemas/expense.schema";
import type { ExpenseInput } from "../schemas/expense-input.schema";
import { manilaToday } from "./expense-format";

export function expenseDraft(record?: Expense): ExpenseInput {
  return record
    ? {
        expense_date: record.expense_date,
        scope: record.scope,
        branch_id: record.branch_id,
        category_id: record.category_id,
        description: record.description,
        amount: record.amount,
        payment_method: record.payment_method ?? "CASH",
        cash_source: record.cash_source,
        cash_movement_id: record.cash_movement_id,
        payee: record.payee,
        reference: record.reference,
        notes: record.notes,
      }
    : {
        expense_date: manilaToday(),
        scope: "BRANCH",
        branch_id: null,
        category_id: "",
        description: "",
        amount: "",
        payment_method: "CASH",
        cash_source: "OTHER",
        cash_movement_id: null,
        payee: null,
        reference: null,
        notes: null,
      };
}
export function changeExpenseLocation(
  draft: ExpenseInput,
  location: string,
): ExpenseInput {
  return {
    ...draft,
    scope: location === "COMMISSARY" ? "COMMISSARY" : "BRANCH",
    branch_id: location === "COMMISSARY" ? null : location || null,
    cash_source: draft.payment_method === "CASH" ? "OTHER" : null,
    cash_movement_id: null,
    amount: draft.cash_movement_id ? "" : draft.amount,
  };
}
export function changeExpensePayment(
  draft: ExpenseInput,
  payment: ExpenseInput["payment_method"],
): ExpenseInput {
  return {
    ...draft,
    payment_method: payment,
    cash_source: payment === "CASH" ? "OTHER" : null,
    cash_movement_id: null,
    amount: draft.cash_movement_id ? "" : draft.amount,
  };
}
