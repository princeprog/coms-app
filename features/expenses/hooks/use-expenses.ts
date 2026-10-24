"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseKeys } from "../query-keys";
import {
  getExpenseAction,
  getExpenseCashOutsAction,
  getExpenseCategoriesAction,
  getExpenseLocationsAction,
  listExpensesAction,
  saveExpenseAction,
  saveExpenseCategoryAction,
  voidExpenseAction,
  type ExpenseResult,
} from "../services/expense-actions";
import type { ExpenseQuery } from "../services/expense-query";

export async function unwrap<T>(
  promise: Promise<ExpenseResult<T>>,
): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
export function useExpenses(query: ExpenseQuery) {
  return useQuery({
    queryKey: expenseKeys.list(query),
    queryFn: () => unwrap(listExpensesAction(query)),
    retry: false,
  });
}
export function useExpense(source: string, id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(source, id),
    queryFn: () => unwrap(getExpenseAction(source, id)),
    retry: false,
  });
}
export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: () => unwrap(getExpenseCategoriesAction()),
    retry: false,
  });
}
export function useExpenseLocations() {
  return useQuery({
    queryKey: expenseKeys.locations,
    queryFn: () => unwrap(getExpenseLocationsAction()),
    retry: false,
  });
}
export function useExpenseCashOuts(
  branch: string,
  search: string,
  page: number,
  enabled: boolean,
) {
  const query = { branch_id: branch, search, page, page_size: 10 as const };
  return useQuery({
    queryKey: expenseKeys.cashOuts(query),
    queryFn: () => unwrap(getExpenseCashOutsAction(query)),
    enabled: enabled && Boolean(branch),
    retry: false,
  });
}
export function useExpenseSave(onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: { id?: string; input: unknown; key: string }) =>
      unwrap(saveExpenseAction(args.id, args.input, args.key)),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: expenseKeys.all });
      onSuccess();
    },
  });
}
export function useExpenseVoid(onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: unknown; key: string }) =>
      unwrap(voidExpenseAction(args.id, args.input, args.key)),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: expenseKeys.all });
      onSuccess();
    },
  });
}
export function useExpenseCategorySave(onSuccess: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: { id?: string; input: unknown }) =>
      unwrap(saveExpenseCategoryAction(args.id, args.input)),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: expenseKeys.all });
      onSuccess();
    },
  });
}
