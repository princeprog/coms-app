import { z } from "zod";
import { purchaseToday } from "../services/purchase-date";
const decimal = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/, "Enter a nonnegative number");
export const purchaseInputSchema = z
  .object({
    purchase_date: z.iso
      .date("Choose a valid purchase date")
      .refine(
        (value) => value <= purchaseToday(),
        "Purchase date cannot be in the future",
      ),
    store_name: z.string().trim().max(160).optional(),
    receipt_number: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z
          .object({
            stock_item_id: z.uuid("Choose a stock item"),
            quantity_received: decimal.refine(
              (value) => /[1-9]/.test(value),
              "Enter a quantity greater than zero",
            ),
            unit_cost: decimal,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.items.map((item) => item.stock_item_id)).size ===
      value.items.length,
    { path: ["items"], message: "Choose each stock item only once" },
  );
const outputDecimal = z.string().regex(/^\d+(?:\.\d+)?$/);
const row = {
  id: z.uuid(),
  purchase_date: z.iso.date(),
  store_name: z.string().nullable(),
  receipt_number: z.string().nullable(),
  recorded_at: z.iso.datetime(),
  recorded_by_name: z.string(),
  total_cost: outputDecimal,
};
export const purchaseListSchema = z.object({
  items: z.array(z.object({ ...row, item_count: z.number().int() })),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});
export const purchaseDetailSchema = z.object({
  ...row,
  notes: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.uuid(),
      stock_item_id: z.uuid(),
      stock_item_name: z.string(),
      unit: z.string(),
      quantity_received: decimal,
      unit_cost: decimal,
      line_total: outputDecimal,
    }),
  ),
});
export const purchaseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).catch(1),
  page_size: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(30), z.literal(50)]))
    .catch(10),
  search: z.string().max(100).catch(""),
  purchased_from: z.union([z.iso.date(), z.literal("")]).catch(""),
  purchased_to: z.union([z.iso.date(), z.literal("")]).catch(""),
  sort: z.enum(["newest", "oldest"]).catch("newest"),
});
export type PurchaseInput = z.infer<typeof purchaseInputSchema>;
export type PurchaseDetail = z.infer<typeof purchaseDetailSchema>;
export type PurchasePage = z.infer<typeof purchaseListSchema>;
export type PurchaseQuery = z.infer<typeof purchaseQuerySchema>;
export type PurchaseStock = {
  id: string;
  stock_item_name: string;
  unit: string;
  is_active: boolean;
  /** Current commissary balance; null when the role cannot view balances. */
  quantity_on_hand: string | null;
};
