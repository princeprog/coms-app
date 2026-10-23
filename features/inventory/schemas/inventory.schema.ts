import { z } from "zod";

const decimalText = z.string().regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/);
const nonzeroDecimalText = decimalText.refine((value) => /[1-9]/.test(value));

export const stockStatusSchema = z.enum([
  "INACTIVE",
  "BELOW_ZERO",
  "OUT_OF_STOCK",
  "LOW",
  "RESTOCKING",
  "IN_STOCK",
]);

export const inventoryItemSchema = z.object({
  id: z.uuid(),
  stock_item_name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  // Recorded sales or confirmed dispatch surplus can leave stock below zero.
  quantity_on_hand: decimalText,
  // Sent to the branch but not counted yet; always 0 at the commissary.
  on_the_way: decimalText.default("0"),
  reorder_level: decimalText.nullable().default(null),
  target_level: decimalText.nullable().default(null),
  avg_daily_use: decimalText.default("0"),
  stock_status: stockStatusSchema,
});

export const inventoryPageSchema = z.object({
  items: z.array(inventoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  available_categories: z.array(z.string().min(1)).default([]),
});

export const inventoryMovementSchema = z
  .object({
    id: z.uuid(),
    inventory_scope: z.enum(["COMMISSARY", "BRANCH"]),
    branch_id: z.uuid().nullable(),
    stock_item_id: z.uuid(),
    stock_item_name: z.string().min(1),
    unit: z.string().min(1),
    receipt_id: z.uuid().nullable().optional(),
    receipt_kind: z
      .enum(["SUPPLIER_DELIVERY", "DIRECT_PURCHASE"])
      .nullable()
      .optional(),
    movement_type: z.enum([
      "RECEIPT",
      "ADJUSTMENT",
      "DISPATCH",
      "DISPATCH_RETURN",
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

// Up to 9 whole digits and 3 decimals, matching the API.
const levelText = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/);

export const setStockLevelsSchema = z
  .object({
    stock_item_id: z.uuid(),
    scope: z.enum(["COMMISSARY", "BRANCH"]),
    branch_ids: z.array(z.uuid()).min(1).max(500).optional(),
    reorder_level: levelText.nullable(),
    target_level: levelText.nullable(),
  })
  .strict()
  .refine(
    (value) => (value.reorder_level === null) === (value.target_level === null),
    { message: "Enter both levels or clear both." },
  )
  .refine(
    (value) =>
      value.reorder_level === null ||
      value.target_level === null ||
      Number(value.target_level) > Number(value.reorder_level),
    { message: "Target level must be more than the reorder level." },
  )
  .refine(
    (value) => (value.scope === "BRANCH") === Boolean(value.branch_ids?.length),
    { message: "Choose the branches for these levels." },
  );
