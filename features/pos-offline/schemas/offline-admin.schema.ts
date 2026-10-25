import { z } from "zod";
export const deviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REVOKED"]),
  created_at: z.string(),
});
export type RegisterDevice = z.infer<typeof deviceSchema>;
export const deviceListSchema = z.array(deviceSchema);
export const sessionSchema = z.object({
  id: z.uuid(),
  branch_id: z.uuid(),
  device_id: z.uuid(),
  cashier_id: z.uuid(),
  device_name: z.string(),
  cashier_name: z.string(),
  business_date: z.string(),
  status: z.enum(["OPEN", "FINALIZED"]),
  issued_at: z.string(),
  review_count: z.number().int().nonnegative(),
  last_sync_at: z.string().nullable(),
});
export type RegisterSession = z.infer<typeof sessionSchema>;
const transactionSchema = z.object({
  id: z.uuid(),
  sequence: z.number().int().positive(),
  status: z.enum(["NEEDS_REVIEW", "ACKNOWLEDGED"]),
  reason: z.string().nullable(),
  payload: z.object({
    total_amount: z.string(),
    captured_at: z.string(),
    service_type: z.enum(["DINE_IN", "TAKEAWAY"]),
    items: z.array(
      z.object({
        product_id: z.uuid(),
        quantity: z.string(),
        unit_price: z.string(),
      }),
    ),
  }),
});
export type HeldTransaction = z.infer<typeof transactionSchema>;
function page<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  });
}
export const sessionPageSchema = page(sessionSchema);
export const transactionPageSchema = page(transactionSchema);
