import { z } from "zod";
import { dispatchStatuses } from "@/features/dispatches/constants";
import { stockRequestStatuses } from "@/features/stock-requests/constants";

const decimalText = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/)
  .max(80);
const positiveDecimalText = decimalText.refine((value) => /[1-9]/.test(value));
const nonnegativeDecimalText = decimalText;

const dispatchLineInputSchema = z
  .object({
    dispatch_item_id: z.uuid(),
  })
  .strict();

const receiveItemSchema = dispatchLineInputSchema.extend({
  quantity_received: positiveDecimalText,
});

const closeShortageItemSchema = dispatchLineInputSchema.extend({
  quantity_closed: positiveDecimalText,
});

function uniqueDispatchItems<T extends { dispatch_item_id: string }>(
  items: T[],
) {
  return (
    new Set(items.map((item) => item.dispatch_item_id)).size === items.length
  );
}

export const createDispatchSchema = z
  .object({ stock_request_id: z.uuid() })
  .strict();

export const receiveDispatchSchema = z
  .object({ items: z.array(receiveItemSchema).min(1).max(100) })
  .strict()
  .refine(({ items }) => uniqueDispatchItems(items), {
    message: "A dispatch item may appear only once per receipt.",
  });

export const closeDispatchShortageSchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
    items: z.array(closeShortageItemSchema).min(1).max(100),
  })
  .strict()
  .refine(({ items }) => uniqueDispatchItems(items), {
    message: "A dispatch item may appear only once per shortage closure.",
  });

const dispatchListItemSchema = z.object({
  id: z.uuid(),
  stock_request_id: z.uuid(),
  branch_id: z.uuid(),
  branch_name: z.string().min(1),
  stock_request_status: z.enum(stockRequestStatuses),
  status: z.enum(dispatchStatuses),
  created_by_user_id: z.uuid(),
  created_by_name: z.string().min(1),
  dispatched_by_user_id: z.uuid().nullable(),
  dispatched_by_name: z.string().min(1).nullable(),
  dispatched_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  item_count: z.number().int().nonnegative(),
});

export const dispatchPageSchema = z.object({
  items: z.array(dispatchListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

const dispatchItemSchema = z.object({
  id: z.uuid(),
  stock_request_item_id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  quantity_requested: nonnegativeDecimalText,
  quantity_dispatched: positiveDecimalText,
  quantity_received: nonnegativeDecimalText,
  quantity_shortage_closed: nonnegativeDecimalText,
  quantity_in_transit: nonnegativeDecimalText,
});

const dispatchReceiptItemSchema = z.object({
  receipt_item_id: z.uuid(),
  dispatch_item_id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  quantity_received: positiveDecimalText,
});

const dispatchReceiptSchema = z.object({
  id: z.uuid(),
  received_by_user_id: z.uuid(),
  receiver_name: z.string().min(1),
  created_at: z.iso.datetime(),
  items: z.array(dispatchReceiptItemSchema),
});

const dispatchShortageItemSchema = z.object({
  closure_item_id: z.uuid(),
  dispatch_item_id: z.uuid(),
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  quantity_closed: positiveDecimalText,
});

const dispatchShortageClosureSchema = z.object({
  id: z.uuid(),
  closed_by_user_id: z.uuid(),
  closer_name: z.string().min(1),
  reason: z.string().min(1),
  created_at: z.iso.datetime(),
  items: z.array(dispatchShortageItemSchema),
});

const dispatchEventSchema = z.object({
  id: z.uuid(),
  event_type: z.enum([
    "CREATED",
    "DISPATCHED",
    "RECEIPT_RECORDED",
    "SHORTAGE_CLOSED",
  ]),
  actor_user_id: z.uuid(),
  actor_name: z.string().min(1),
  dispatch_receipt_id: z.uuid().nullable(),
  shortage_closure_id: z.uuid().nullable(),
  created_at: z.iso.datetime(),
});

export const dispatchDetailSchema = z.object({
  id: z.uuid(),
  stock_request_id: z.uuid(),
  branch_id: z.uuid(),
  branch_name: z.string().min(1),
  stock_request_status: z.enum(stockRequestStatuses),
  status: z.enum(dispatchStatuses),
  created_by_user_id: z.uuid(),
  created_by_name: z.string().min(1),
  dispatched_by_user_id: z.uuid().nullable(),
  dispatched_by_name: z.string().min(1).nullable(),
  dispatched_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  items: z.array(dispatchItemSchema),
  receipts: z.array(dispatchReceiptSchema),
  shortage_closures: z.array(dispatchShortageClosureSchema),
  events: z.array(dispatchEventSchema),
});
