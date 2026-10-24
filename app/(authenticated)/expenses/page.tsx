import { expensePage } from "@/features/expenses/services/expense-page";
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return expensePage(await searchParams);
}
