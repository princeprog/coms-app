"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";
import { expenseEndpoints } from "../constants";
import {
  categoriesSchema,
  categorySchema,
  cashOutsSchema,
  expenseDetailSchema,
  expensePageSchema,
  locationsSchema,
  sourceSchema,
} from "../schemas/expense.schema";
import {
  categoryInputSchema,
  correctionSchema,
  expenseInputSchema,
} from "../schemas/expense-input.schema";
import { expenseParams, expenseQuerySchema } from "./expense-query";

export type ExpenseResult<T> =
  { ok: true; data: T } | { ok: false; error: string; status?: number };
async function request<T>(
  permission: string,
  path: string,
  schema: z.ZodType<T>,
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: unknown,
  key?: string,
): Promise<ExpenseResult<T>> {
  try {
    const session = await getCurrentUserFromServer();
    if (session.status !== "authenticated")
      return {
        ok: false,
        error: "Your session is unavailable. Sign in again.",
        status: 401,
      };
    if (
      !hasPermission(session.user, "expenses.read") ||
      !hasPermission(session.user, permission)
    )
      return {
        ok: false,
        error: "You do not have permission for this expense action.",
        status: 403,
      };
    const payload = await requestComsApi<unknown>(path, {
      cookieHeader: (await cookies()).toString(),
      method,
      body,
      headers: key ? { "Idempotency-Key": key } : undefined,
    });
    const parsed = schema.safeParse(payload);
    if (!parsed.success)
      return {
        ok: false,
        error: "The expense response could not be read. Refresh and try again.",
        status: 502,
      };
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (error instanceof ApiRequestError)
      return {
        ok: false,
        status: error.status,
        error:
          error.status === 401
            ? "Your session expired. Sign in again."
            : error.status === 403
              ? "Your access has changed. Refresh to check your permissions."
              : error.status >= 500
                ? "Expenses are unavailable. Your draft is preserved; try again."
                : error.message,
      };
    return {
      ok: false,
      error: "Expenses are unavailable. Your draft is preserved; try again.",
    };
  }
}
const invalid = (error = "Check the expense details.") => ({
  ok: false as const,
  error,
});
export async function listExpensesAction(input: unknown) {
  const parsed = expenseQuerySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  return request(
    "expenses.read",
    `${expenseEndpoints.list}?${expenseParams(parsed.data)}`,
    expensePageSchema,
  );
}
export async function getExpenseAction(source: string, id: string) {
  if (
    !sourceSchema.safeParse(source).success ||
    !z.uuid().safeParse(id).success
  )
    return invalid("Choose a valid expense.");
  return request(
    "expenses.read",
    expenseEndpoints.detail(source, id),
    expenseDetailSchema,
  );
}
export async function getExpenseLocationsAction() {
  return request("expenses.read", expenseEndpoints.locations, locationsSchema);
}
export async function getExpenseCategoriesAction() {
  return request(
    "expenses.read",
    expenseEndpoints.categories,
    categoriesSchema,
  );
}
export async function getExpenseCashOutsAction(input: unknown) {
  const parsed = z
    .object({
      branch_id: z.uuid(),
      search: z.string().max(160),
      page: z.number().int().positive(),
      page_size: z.literal(10),
    })
    .safeParse(input);
  if (!parsed.success) return invalid("Choose a branch to find cash outs.");
  return request(
    "shifts.read",
    `${expenseEndpoints.cashOuts}?${expenseParams(parsed.data)}`,
    cashOutsSchema,
  );
}
export async function saveExpenseAction(
  id: string | undefined,
  input: unknown,
  key: string,
) {
  if (
    !z.uuid().safeParse(key).success ||
    (id !== undefined && !z.uuid().safeParse(id).success)
  )
    return invalid();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  if (id) {
    const correction = correctionSchema.safeParse(input);
    if (!correction.success) return invalid(correction.error.issues[0].message);
    return request(
      "expenses.update",
      expenseEndpoints.record(id),
      expenseDetailSchema,
      "PATCH",
      { ...parsed.data, ...correction.data },
      key,
    );
  }
  return request(
    "expenses.create",
    expenseEndpoints.list,
    expenseDetailSchema,
    "POST",
    parsed.data,
    key,
  );
}
export async function voidExpenseAction(
  id: string,
  input: unknown,
  key: string,
) {
  const parsed = correctionSchema.safeParse(input);
  if (
    !parsed.success ||
    !z.uuid().safeParse(id).success ||
    !z.uuid().safeParse(key).success
  )
    return invalid(parsed.error?.issues[0]?.message);
  return request(
    "expenses.void",
    expenseEndpoints.void(id),
    expenseDetailSchema,
    "POST",
    parsed.data,
    key,
  );
}
export async function saveExpenseCategoryAction(
  id: string | undefined,
  input: unknown,
) {
  const parsed = (
    id
      ? categoryInputSchema
          .partial()
          .extend({ is_active: z.boolean().optional() })
      : categoryInputSchema
  ).safeParse(input);
  if (!parsed.success || (id !== undefined && !z.uuid().safeParse(id).success))
    return invalid(parsed.error?.issues[0]?.message);
  return request(
    "expenses.categories_manage",
    `${expenseEndpoints.categories}${id ? `/${id}` : ""}`,
    categorySchema,
    id ? "PATCH" : "POST",
    parsed.data,
  );
}
