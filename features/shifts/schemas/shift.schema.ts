import { z } from "zod";

const amount = z.string().regex(/^-?\d+(?:\.\d+)?$/);
const optionalAmount = amount.nullable();

export const shiftStatusSchema = z.enum(["OPEN", "CLOSED", "REVIEWED"]);

export const shiftSchema = z.object({
  id: z.uuid(),
  branch_id: z.uuid(),
  branch_name: z.string().default(""),
  business_date: z.iso.date(),
  shift_number: z.number().int().positive(),
  status: shiftStatusSchema,
  opened_by_user_id: z.uuid(),
  opened_by_name: z.string(),
  opened_at: z.string(),
  opening_float: amount,
  expected_opening_float: optionalAmount,
  opening_difference: optionalAmount,
  closed_by_user_id: z.uuid().nullable(),
  closed_by_name: z.string().nullable(),
  closed_at: z.string().nullable(),
  close_type: z.enum(["CASHIER", "FORCED"]).nullable(),
  force_close_reason: z.string().nullable(),
  counted_cash: optionalAmount,
  left_in_drawer: optionalAmount,
  expected_cash: optionalAmount,
  cash_difference: optionalAmount,
  cashier_explanation: z.string().nullable(),
  reviewed_by_user_id: z.uuid().nullable(),
  reviewed_by_name: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  review_note: z.string().nullable(),
  business_day_ends_at: z.string(),
  business_day_ended: z.boolean(),
  sales_count: z.number().int().nonnegative(),
});

export const shiftDetailSchema = shiftSchema.extend({
  totals: z.object({
    cash_sales_amount: optionalAmount,
    non_cash_sales_amount: optionalAmount,
    cash_refunds_amount: optionalAmount,
    cash_in_amount: optionalAmount,
    cash_out_amount: optionalAmount,
    expected_cash: optionalAmount,
    sales_count: z.number().int().nonnegative(),
    voids_count: z.number().int().nonnegative(),
  }),
  payments: z.array(
    z.object({
      tender_method: z.string(),
      payment_kind: z.string().nullable(),
      sales_count: z.number().int().nonnegative(),
      amount,
    }),
  ),
  cash_movements: z.array(
    z.object({
      id: z.uuid(),
      direction: z.enum(["IN", "OUT"]),
      amount,
      reason: z.string(),
      actor_name: z.string(),
      created_at: z.string(),
    }),
  ),
  voids: z.array(
    z.object({
      sale_id: z.uuid(),
      sale_reference: z.string(),
      amount: optionalAmount,
      payment_kind: z.string(),
      reason: z.string().nullable(),
      actor_name: z.string(),
      created_at: z.string(),
    }),
  ),
  cash_hidden: z.boolean().default(false),
});

/** The shift page adds report figures; null while a cashier's count is blind. */
export const shiftReportSchema = shiftDetailSchema.extend({
  sales_summary: z
    .object({
      sales_count: z.number().int().nonnegative(),
      gross_amount: amount,
      voided_count: z.number().int().nonnegative(),
      voided_amount: amount,
      completed_count: z.number().int().nonnegative(),
      net_amount: amount,
      average_amount: optionalAmount,
      items_sold: amount,
      dine_in_count: z.number().int().nonnegative(),
      dine_in_amount: amount,
      takeaway_count: z.number().int().nonnegative(),
      takeaway_amount: amount,
      first_sale_at: z.string().nullable(),
      last_sale_at: z.string().nullable(),
    })
    .nullable(),
  products: z.array(
    z.object({
      product_id: z.uuid(),
      product_name: z.string(),
      category_name: z.string().nullable(),
      quantity: amount,
      amount,
    }),
  ),
});

export const shiftPageSchema = z.object({
  items: z.array(shiftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const shiftQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  page_size: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(30), z.literal(50)]))
    .catch(10),
  status: z.union([shiftStatusSchema, z.literal("")]).catch(""),
  date_from: z.union([z.iso.date(), z.literal("")]).catch(""),
  date_to: z.union([z.iso.date(), z.literal("")]).catch(""),
});

/** Pesos typed by staff: optional thousands commas, up to two decimals. */
export const pesoInputSchema = z
  .string()
  .transform((value) => value.trim().replaceAll(",", ""))
  .pipe(
    z
      .string()
      .min(1, "Enter an amount")
      .regex(
        /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/,
        "Enter pesos with up to two decimals",
      ),
  );

export type Shift = z.infer<typeof shiftSchema>;
export type ShiftDetail = z.infer<typeof shiftDetailSchema>;
export type ShiftReport = z.infer<typeof shiftReportSchema>;
export type ShiftPage = z.infer<typeof shiftPageSchema>;
export type ShiftQuery = z.infer<typeof shiftQuerySchema>;
export type ShiftResult<T> =
  { ok: true; data: T } | { ok: false; error: string; code?: string };
