import { z } from "zod";

const decimalStringSchema = z
  .string()
  .max(80)
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);
const positiveDecimalStringSchema = decimalStringSchema.refine((value) =>
  /[1-9]/.test(value),
);

const saleHeaderSchema = z.object({
  id: z.uuid(),
  branch_id: z.uuid(),
  cashier_user_id: z.uuid(),
  status: z.enum(["COMPLETED", "VOIDED"]),
  tender_method: z.string().min(1).max(40),
  total_amount: decimalStringSchema,
  idempotency_key: z.uuid(),
  created_at: z.iso.datetime(),
});

export const salePageSchema = z.object({
  items: z.array(saleHeaderSchema.extend({ cashier_name: z.string().min(1) })),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const saleItemSchema = z.object({
  id: z.uuid(),
  product_id: z.uuid(),
  product_name_snapshot: z.string().min(1).max(160),
  quantity: positiveDecimalStringSchema,
  unit_price: decimalStringSchema,
  line_total: decimalStringSchema,
  created_at: z.iso.datetime(),
});

export const saleEventSchema = z.object({
  id: z.uuid(),
  event_type: z.enum(["COMPLETED", "VOIDED"]),
  actor_user_id: z.uuid(),
  reason: z.string().nullable(),
  created_at: z.iso.datetime(),
});

export const saleDetailSchema = saleHeaderSchema.extend({
  items: z.array(saleItemSchema),
  events: z.array(saleEventSchema),
});

export const createSaleSchema = z
  .object({
    tender_method: z.string().trim().min(1).max(40),
    items: z
      .array(
        z.object({
          product_id: z.uuid(),
          quantity: positiveDecimalStringSchema,
        }),
      )
      .min(1)
      .max(40),
  })
  .strict()
  .superRefine((sale, context) => {
    const seen = new Set<string>();
    sale.items.forEach((item, index) => {
      if (seen.has(item.product_id))
        context.addIssue({
          code: "custom",
          path: ["items", index, "product_id"],
          message: "A product may appear only once in a sale.",
        });
      seen.add(item.product_id);
    });
  });

export const voidSaleSchema = z
  .object({ reason: z.string().trim().min(1).max(500) })
  .strict();
