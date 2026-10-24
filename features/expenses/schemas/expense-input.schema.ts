import { z } from "zod";
import { cents, manilaToday } from "../services/expense-format";
import { paymentSchema, scopeSchema } from "./expense.schema";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => value || null);
export const expenseInputSchema = z
  .object({
    expense_date: z.iso
      .date()
      .refine(
        (value) => value <= manilaToday(),
        "Choose today or an earlier date.",
      ),
    scope: scopeSchema,
    branch_id: z.uuid().nullable(),
    category_id: z.uuid("Choose a category."),
    description: z.string().trim().min(1, "Enter a description.").max(160),
    amount: z
      .string()
      .regex(
        /^\d{1,9}(\.\d{1,2})?$/,
        "Enter an amount with up to two decimal places.",
      )
      .refine(
        (value) =>
          /^\d{1,9}(\.\d{1,2})?$/.test(value) && cents(value) > BigInt(0),
        "Amount must be greater than zero.",
      ),
    payment_method: paymentSchema,
    cash_source: z.enum(["REGISTER", "OTHER"]).nullable(),
    cash_movement_id: z.uuid().nullable(),
    payee: optionalText(160),
    reference: optionalText(100),
    notes: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if ((value.scope === "BRANCH") !== Boolean(value.branch_id))
      issue("branch_id", "Choose a valid location.");
    if (value.payment_method === "CASH" && !value.cash_source)
      issue("cash_source", "Choose where the cash came from.");
    if (
      value.payment_method !== "CASH" &&
      (value.cash_source || value.cash_movement_id)
    )
      issue("cash_source", "Non-cash payments cannot link register cash.");
    if (
      value.cash_source === "REGISTER" &&
      (value.scope !== "BRANCH" || !value.cash_movement_id)
    )
      issue("cash_movement_id", "Select an existing cash out for this branch.");
    if (value.cash_source !== "REGISTER" && value.cash_movement_id)
      issue("cash_movement_id", "Only register cash can link a cash out.");
  });
export const correctionSchema = z.object({
  revision: z.number().int().positive(),
  reason: z.string().trim().min(1, "Explain the correction.").max(500),
});
export const categoryInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a category name.")
    .max(80)
    .refine(
      (value) => value.toLowerCase() !== "stock purchases",
      "Stock purchases is reserved for imported purchases.",
    ),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
