import { z } from "zod";

const decimalText = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);
const nonzeroDecimalText = decimalText.refine((value) => /[1-9]/.test(value));
const nonnegativeDecimalText = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/);

export const inventoryItemSchema = z.object({
  id: z.uuid(),
  stock_item_name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  quantity_on_hand: nonnegativeDecimalText,
});

export const inventoryPageSchema = z.object({
  items: z.array(inventoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const inventoryMovementSchema = z
  .object({
    id: z.uuid(),
    inventory_scope: z.enum(["COMMISSARY", "BRANCH"]),
    branch_id: z.uuid().nullable(),
    stock_item_id: z.uuid(),
    stock_item_name: z.string().min(1),
    unit: z.string().min(1),
    movement_type: z.enum([
      "RECEIPT",
      "ADJUSTMENT",
      "DISPATCH",
      "TRANSFER_IN",
      "SALE",
      "SALE_VOID",
      "REPORT_ADJUSTMENT",
    ]),
    quantity_delta: nonzeroDecimalText,
    reason: z.string().nullable(),
    actor_user_id: z.uuid(),
    idempotency_key: z.uuid().nullable(),
    created_at: z.iso.datetime(),
  })
  .refine(
    (movement) =>
      movement.inventory_scope === "COMMISSARY"
        ? movement.branch_id === null
        : movement.branch_id !== null,
    { message: "Movement branch must match its inventory scope." },
  );

export const inventoryMovementPageSchema = z.object({
  items: z.array(inventoryMovementSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const createInventoryAdjustmentSchema = z
  .object({
    stock_item_id: z.uuid(),
    quantity_delta: nonzeroDecimalText,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
