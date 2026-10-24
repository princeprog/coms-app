import { expensePage } from "@/features/expenses/services/expense-page";
export default async function ExpenseCategoriesPage() {
  return expensePage({}, true);
}
