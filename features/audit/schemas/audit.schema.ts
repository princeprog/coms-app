import { z } from "zod";

export const auditAreaValues = [
  "product",
  "product_category",
  "stock_item",
  "supplier",
  "branch",
  "payment_method",
  "business_day",
  "staff",
  "role",
  "export",
] as const;

export const auditEventSchema = z.object({
  id: z.uuid(),
  occurred_at: z.string(),
  actor_user_id: z.string().nullable(),
  actor_name: z.string().nullable(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().nullable(),
  entity_label: z.string().nullable(),
  branch_id: z.string().nullable(),
  changes: z.record(
    z.string(),
    z.object({ from: z.unknown(), to: z.unknown() }),
  ),
  metadata: z.record(z.string(), z.unknown()),
});

export const auditEventPageSchema = z.object({
  items: z.array(auditEventSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const auditQuerySchema = z.object({
  area: z.enum(auditAreaValues).optional().catch(undefined),
  from: date.optional().catch(undefined),
  to: date.optional().catch(undefined),
  search: z.string().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  page_size: z.coerce
    .number()
    .refine((n) => [10, 30, 50].includes(n))
    .catch(10),
});

export type AuditArea = (typeof auditAreaValues)[number];
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditEventPage = z.infer<typeof auditEventPageSchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;
