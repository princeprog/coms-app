import { z } from "zod";
import { scopeSchema, sourceSchema } from "../schemas/expense.schema";
import { monthRange } from "./expense-format";

export const expenseQuerySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    scope: scopeSchema.optional(),
    branch_id: z.uuid().optional(),
    category_id: z.union([z.uuid(), z.literal("STOCK_PURCHASES")]).optional(),
    source: sourceSchema.optional(),
    status: z.enum(["RECORDED", "VOIDED", "all"]).catch("RECORDED"),
    search: z.string().max(160).catch(""),
    sort: z
      .enum(["newest", "oldest", "amount_highest", "amount_lowest"])
      .catch("newest"),
    page: z.coerce.number().int().positive().catch(1),
    page_size: z.coerce
      .number()
      .refine((value) => [10, 30, 50].includes(value))
      .catch(10),
  })
  .refine((value) => value.from <= value.to, {
    message: "Start date must not be after end date.",
    path: ["to"],
  });
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export function defaultExpenseQuery(): ExpenseQuery {
  return {
    ...monthRange(),
    status: "RECORDED",
    search: "",
    sort: "newest",
    page: 1,
    page_size: 10,
  };
}
export function expenseParams(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  return params;
}
export function expenseHref(query: ExpenseQuery) {
  return `/expenses?${expenseParams(query)}`;
}
