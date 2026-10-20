import { z } from "zod";
export const notificationKindSchema = z.enum([
  "DISPATCH_SENT",
  "DISPATCH_DISCREPANCY",
  "DISPATCH_RESOLVED",
  "REPORT_SUBMITTED",
  "REPORT_RETURNED",
  "REPORT_APPROVED",
  "DISPATCH_OVERDUE",
  "DISPATCH_LATE_COUNT",
]);
export const notificationSchema = z.object({
  id: z.uuid(),
  kind: notificationKindSchema,
  branch_id: z.uuid(),
  branch_name: z.string(),
  dispatch_id: z.uuid().nullable(),
  report_id: z.uuid().nullable(),
  business_date: z.string().nullable(),
  overdue_count: z.number().int().nonnegative().nullable().optional(),
  created_at: z.string(),
  read_at: z.string().nullable(),
});
export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});
export const notificationFiltersSchema = z.object({
  status: z.enum(["all", "unread"]),
  type: z.enum(["all", "dispatches", "reports"]),
  page: z.number().int().min(1).max(1000000),
  page_size: z.union([z.literal(10), z.literal(30), z.literal(50)]),
});
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationKind = z.infer<typeof notificationKindSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
export type NotificationResult<T> =
  { ok: true; data: T } | { ok: false; error: string; status: number };
