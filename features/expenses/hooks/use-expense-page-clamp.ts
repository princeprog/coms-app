"use client";
import { useEffect, useRef } from "react";
import type { useDirectoryQuery } from "@/hooks/use-directory-query";
import type { ExpensePage } from "../schemas/expense.schema";
import { expenseHref, type ExpenseQuery } from "../services/expense-query";

export type ExpenseDirectory = ReturnType<
  typeof useDirectoryQuery<ExpenseQuery>
>;

/** Clamp only the settled response for this URL; never navigate from old rows. */
export function useExpensePageClamp(
  query: ExpenseQuery,
  data: ExpensePage | undefined,
  settled: boolean,
  directory: ExpenseDirectory,
) {
  const attempted = useRef<string | null>(null);
  const { apply, pending } = directory;
  useEffect(() => {
    if (
      !settled ||
      pending ||
      !data ||
      data.page !== query.page ||
      data.page_size !== query.page_size
    )
      return;
    const lastPage = Math.max(1, Math.ceil(data.total / data.page_size));
    if (query.page <= lastPage) {
      attempted.current = null;
      return;
    }
    const signature = `${expenseHref(query)}=>${lastPage}`;
    if (attempted.current === signature) return;
    attempted.current = signature;
    apply({ page: lastPage }, { resetPage: false });
  }, [query, data, settled, pending, apply]);
}
