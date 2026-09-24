import { z } from "zod";
import { dailyReportStatuses } from "@/features/daily-reports/constants";

const decimalStringSchema = z
  .string()
  .max(80)
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);
const signedDecimalStringSchema = z
  .string()
  .max(80)
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);

function isZeroDecimal(value: string) {
  return value.replace(/[-.]/g, "").replaceAll("0", "") === "";
}

export const createDailyReportSchema = z
  .object({ business_date: z.iso.date() })
  .strict();

const dailyReportItemInputSchema = z
  .object({
    stock_item_id: z.uuid(),
    physical_closing_quantity: decimalStringSchema,
    waste_quantity: decimalStringSchema,
    waste_reason: z.string().trim().max(500).optional(),
    adjustment_quantity: signedDecimalStringSchema,
    adjustment_reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((item, context) => {
    if (!isZeroDecimal(item.waste_quantity) && !item.waste_reason) {
      context.addIssue({
        code: "custom",
        path: ["waste_reason"],
        message: "Enter a reason for recorded waste.",
      });
    }
    if (!isZeroDecimal(item.adjustment_quantity) && !item.adjustment_reason) {
      context.addIssue({
        code: "custom",
        path: ["adjustment_reason"],
        message: "Enter a reason for the adjustment.",
      });
    }
  });

export const updateDailyReportSchema = z
  .object({
    items: z.array(dailyReportItemInputSchema).min(1).max(500),
  })
  .strict()
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.stock_item_id)).size === items.length,
    { message: "A stock item may appear only once in a report." },
  );

export const returnDailyReportSchema = z
  .object({ reason: z.string().trim().min(1).max(500) })
  .strict();

const dailyReportHeaderSchema = z.object({
  id: z.uuid(),
  branch_id: z.uuid(),
  business_date: z.iso.date(),
  status: z.enum(dailyReportStatuses),
  idempotency_key: z.uuid(),
  created_by_user_id: z.uuid(),
  submitted_by_user_id: z.uuid().nullable(),
  submitted_at: z.iso.datetime().nullable(),
  reviewed_by_user_id: z.uuid().nullable(),
  reviewed_at: z.iso.datetime().nullable(),
  return_reason: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const dailyReportItemSchema = z.object({
  id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  opening_quantity: decimalStringSchema,
  receipt_quantity: decimalStringSchema,
  sale_consumption_quantity: decimalStringSchema,
  sale_void_reversal_quantity: decimalStringSchema,
  ledger_adjustment_quantity: signedDecimalStringSchema,
  ledger_closing_quantity: decimalStringSchema,
  waste_quantity: decimalStringSchema,
  waste_reason: z.string().nullable(),
  adjustment_quantity: signedDecimalStringSchema,
  adjustment_reason: z.string().nullable(),
  expected_closing_quantity: signedDecimalStringSchema,
  physical_closing_quantity: decimalStringSchema.nullable(),
  variance_quantity: signedDecimalStringSchema.nullable(),
});

export const dailyReportListItemSchema = dailyReportHeaderSchema;

export const dailyReportEventSchema = z.object({
  id: z.uuid(),
  event_type: z.enum([
    "CREATED",
    "UPDATED",
    "SUBMITTED",
    "RETURNED",
    "APPROVED",
  ]),
  actor_user_id: z.uuid(),
  actor_name: z.string().min(1),
  note: z.string().nullable(),
  created_at: z.iso.datetime(),
});

export const dailyReportPageSchema = z.object({
  items: z.array(dailyReportListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const dailyReportDetailSchema = dailyReportHeaderSchema.extend({
  items: z.array(dailyReportItemSchema),
  events: z.array(dailyReportEventSchema),
});
