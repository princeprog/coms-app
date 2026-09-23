import { z } from "zod";

const decimalText = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/)
  .max(80);
const positiveDecimalText = decimalText.refine((value) => /[1-9]/.test(value));

export const createSupplierReceiptSchema = z
  .object({
    supplier_id: z.uuid(),
    received_at: z.iso.date(),
    items: z
      .array(
        z
          .object({
            stock_item_id: z.uuid(),
            quantity_received: positiveDecimalText,
            unit_cost: decimalText,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

const receiptFields = {
  id: z.uuid(),
  supplier_id: z.uuid(),
  supplier_name: z.string().min(1),
  received_at: z.iso.date(),
  status: z.enum(["DRAFT", "POSTED"]),
  idempotency_key: z.uuid(),
  created_by_user_id: z.uuid(),
  posted_by_user_id: z.uuid().nullable(),
  posted_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  total_cost: decimalText,
};

export const supplierReceiptListItemSchema = z.object({
  ...receiptFields,
  item_count: z.number().int().nonnegative(),
});

export const supplierReceiptPageSchema = z.object({
  items: z.array(supplierReceiptListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const supplierReceiptItemSchema = z.object({
  id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  quantity_received: decimalText,
  unit_cost: decimalText,
  line_total: decimalText,
});

export const supplierReceiptDetailSchema = z.object({
  ...receiptFields,
  items: z.array(supplierReceiptItemSchema),
});
