import { z } from "zod";
import { stockRequestStatuses } from "@/features/stock-requests/constants";

const decimalText = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/)
  .max(80);
const positiveDecimalText = decimalText.refine((value) => /[1-9]/.test(value));

export const createStockRequestSchema = z
  .object({
    branch_id: z.uuid(),
    items: z
      .array(
        z
          .object({
            stock_item_id: z.uuid(),
            quantity_requested: positiveDecimalText,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.stock_item_id)).size === items.length,
    { message: "A stock item may appear only once in a request." },
  );

const stockRequestFields = {
  id: z.uuid(),
  branch_id: z.uuid(),
  branch_name: z.string().min(1),
  requested_by_user_id: z.uuid(),
  requester_name: z.string().min(1),
  status: z.enum(stockRequestStatuses),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
};

export const stockRequestListItemSchema = z.object({
  ...stockRequestFields,
  item_count: z.number().int().nonnegative(),
});

export const stockRequestPageSchema = z.object({
  items: z.array(stockRequestListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const stockRequestItemSchema = z.object({
  id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  quantity_requested: decimalText,
  created_at: z.iso.datetime(),
});

export const stockRequestEventSchema = z.object({
  id: z.uuid(),
  event_type: z.enum(["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]),
  actor_user_id: z.uuid(),
  actor_name: z.string().min(1),
  created_at: z.iso.datetime(),
});

export const stockRequestDetailSchema = z.object({
  ...stockRequestFields,
  items: z.array(stockRequestItemSchema),
  events: z.array(stockRequestEventSchema),
});
