import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasPermission } from "@/features/auth/permissions";
import { ExpensesWorkspace } from "../components/expenses-workspace";
import { ExpenseCategories } from "../components/expense-categories";
import { defaultExpenseQuery, expenseQuerySchema } from "./expense-query";

export async function expensePage(
  search: Record<string, string | string[] | undefined>,
  categories = false,
) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (
    !hasPermission(session.user, "expenses.read") ||
    (categories && !hasPermission(session.user, "expenses.categories_manage"))
  )
    notFound();
  const query = expenseQuerySchema.safeParse({
    ...defaultExpenseQuery(),
    ...Object.fromEntries(
      Object.entries(search).filter(([, value]) => typeof value === "string"),
    ),
  });
  return (
    <AppPageShell user={session.user}>
      {categories ? (
        <ExpenseCategories />
      ) : query.success ? (
        <ExpensesWorkspace user={session.user} query={query.data} />
      ) : (
        <div role="alert" className="space-y-3">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p>
            These expense filters are invalid. {query.error.issues[0].message}
          </p>
          <Link href="/expenses" className="underline">
            Reset expense filters
          </Link>
        </div>
      )}
    </AppPageShell>
  );
}
