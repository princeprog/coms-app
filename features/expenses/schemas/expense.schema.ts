import { z } from "zod";

export const sourceSchema = z.enum([
  "OPERATING",
  "SUPPLIER_DELIVERY",
  "DIRECT_PURCHASE",
]);
export const paymentSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "EWALLET",
  "CARD",
  "OTHER",
]);
// Response aggregates preserve PostgreSQL precision; input validation stays
// separately constrained to two decimal places in expense-input.schema.ts.
export const decimalSchema = z.string().regex(/^\d+(\.\d+)?$/);
export const scopeSchema = z.enum(["COMMISSARY", "BRANCH"]);
export const expenseSchema = z.object({
  id: z.uuid(),
  source: sourceSchema,
  expense_date: z.iso.date(),
  scope: scopeSchema,
  branch_id: z.uuid().nullable(),
  location_name: z.string(),
  category_id: z.string(),
  category_name: z.string(),
  description: z.string(),
  amount: decimalSchema,
  payment_method: paymentSchema.nullable(),
  cash_source: z.enum(["REGISTER", "OTHER"]).nullable(),
  cash_movement_id: z.uuid().nullable(),
  payee: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(["RECORDED", "VOIDED"]),
  revision: z.number().int().positive(),
  created_by_user_id: z.uuid().nullable(),
  created_by_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export const breakdownSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: decimalSchema,
});
export const expensePageSchema = z.object({
  items: z.array(expenseSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  summary: z.object({
    recorded_spending: decimalSchema,
    operating_expenses: decimalSchema,
    stock_purchases: decimalSchema,
  }),
  by_location: z.array(breakdownSchema),
  by_category: z.array(breakdownSchema),
});
export const expenseDetailSchema = z.object({
  record: expenseSchema,
  source_href: z.string().nullable().optional(),
  history: z.array(
    z.object({
      id: z.uuid(),
      action: z.enum(["CREATED", "UPDATED", "VOIDED"]),
      reason: z.string().nullable(),
      actor_name: z.string().nullable(),
      created_at: z.string(),
      before: z.record(z.string(), z.unknown()).nullable(),
      after: z.record(z.string(), z.unknown()),
    }),
  ),
});
export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export const categoriesSchema = z.object({ items: z.array(categorySchema) });
export const locationsSchema = z.object({
  items: z.array(
    z.object({
      scope: scopeSchema,
      branch_id: z.uuid().nullable(),
      name: z.string(),
      is_active: z.boolean(),
    }),
  ),
});
export const cashOutsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      shift_id: z.uuid(),
      shift_number: z.union([z.string(), z.number()]),
      business_date: z.iso.date(),
      amount: decimalSchema,
      reason: z.string(),
      actor_name: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseDetail = z.infer<typeof expenseDetailSchema>;
export type ExpensePage = z.infer<typeof expensePageSchema>;
export type ExpenseCategory = z.infer<typeof categorySchema>;
export type ExpenseLocation = z.infer<typeof locationsSchema>["items"][number];
export type CashOut = z.infer<typeof cashOutsSchema>["items"][number];
