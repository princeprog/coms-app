import { z } from "zod";

const decimal = z.string().regex(/^-?\d+(?:\.\d+)?$/);

export const dashboardQuerySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    branch_id: z.uuid().optional(),
  })
  .strict();

const summarySchema = z.object({
  completed_sales_amount: decimal,
  completed_sales_count: z.number().int().nonnegative(),
  voided_sales_amount: decimal,
  voided_sales_count: z.number().int().nonnegative(),
  units_sold: decimal,
  submitted_reports_count: z.number().int().nonnegative(),
  approved_reports_count: z.number().int().nonnegative(),
  open_discrepancies_count: z.number().int().nonnegative(),
  in_transit_dispatches_count: z.number().int().nonnegative(),
});

const branchSchema = summarySchema.extend({
  branch_id: z.uuid(),
  branch_name: z.string().min(1),
  branch_status: z.string().min(1),
});

export const dashboardResponseSchema = z.object({
  period: z.object({
    from: z.iso.date(),
    to: z.iso.date(),
    time_zone: z.literal("Asia/Manila"),
  }),
  summary: summarySchema,
  sales_trend: z.array(
    z.object({
      date: z.iso.date(),
      completed_sales_amount: decimal,
      completed_sales_count: z.number().int().nonnegative(),
      voided_sales_amount: decimal,
      voided_sales_count: z.number().int().nonnegative(),
      units_sold: decimal,
    }),
  ),
  branches: z.array(branchSchema),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type DashboardData = z.infer<typeof dashboardResponseSchema>;
