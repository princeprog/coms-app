import { z } from "zod";

export const attentionKeys = [
  "deliveries_overdue",
  "open_discrepancies",
  "shifts_open_past_day",
  "cash_shortages",
  "stock_below_zero",
  "commissary_stock_below_zero",
  "branch_stock_low",
  "commissary_stock_low",
  "reports_missing",
  "reports_returned",
  "reports_to_review",
  "late_counts_to_review",
  "shifts_to_review",
  "dispatches_draft",
  "deliveries_in_transit",
  "products_incomplete_costs",
] as const;

const money = z.string();
const nullableMoney = z.string().nullable();

export const reportProgressSchema = z.object({
  branch_id: z.string(),
  period: z.enum(["today", "yesterday"]),
  business_date: z.string(),
  report_id: z.string().nullable(),
  status: z.enum(["DRAFT", "SUBMITTED", "RETURNED", "APPROVED", "MISSING"]),
  total_items: z.number().int().nullable(),
  counted_items: z.number().int().nullable(),
  open_shifts: z.number().int(),
  unreviewed_shifts: z.number().int(),
  pending_deliveries: z.number().int(),
  counts_awaiting_review: z.number().int(),
  day_ended: z.boolean(),
  had_sales: z.boolean(),
});

export const dashboardTodaySchema = z.object({
  workspace: z.enum(["overview", "branch"]),
  access: z.object({
    reports: z.boolean(),
    shifts: z.boolean(),
    sales: z.boolean(),
    dispatches: z.boolean(),
  }),
  submission_checklist_bypassed: z.boolean(),
  report_progress: z.array(reportProgressSchema),
  count_shortages: z.object({
    days: z.number().int(),
    branches: z.array(
      z.object({
        branch_id: z.string(),
        branch_name: z.string(),
        reports: z.number().int(),
        short_lines: z.number().int(),
        uncosted_short_lines: z.number().int(),
        shortage_value: nullableMoney,
      }),
    ),
    items: z.array(
      z.object({
        branch_id: z.string(),
        branch_name: z.string(),
        stock_item_id: z.string(),
        stock_item_name: z.string(),
        unit: z.string(),
        short_quantity: z.string(),
        shortage_value: nullableMoney,
        times_short: z.number().int(),
        latest_report_id: z.string(),
        latest_business_date: z.string(),
      }),
    ),
  }),
  report_backlog: z.object({
    total: z.number().int(),
    items: z.array(
      z.object({
        branch_id: z.string(),
        branch_name: z.string(),
        business_date: z.string(),
        report_id: z.string().nullable(),
        status: z.enum(["DRAFT", "RETURNED", "MISSING"]),
        days_outstanding: z.number().int(),
      }),
    ),
  }),
  business_date: z.string(),
  as_of: z.string(),
  scope_label: z.string(),
  branch_options: z.array(
    z.object({ id: z.string(), name: z.string(), status: z.string() }),
  ),
  show_costs: z.boolean(),
  today: z.object({
    net_sales: money,
    sales_count: z.number().int(),
    average_sale: nullableMoney,
    items_sold: z.string(),
    void_count: z.number().int(),
    food_cost: nullableMoney,
    gross_profit: nullableMoney,
    cost_coverage_percent: z.string().nullable(),
  }),
  last_week_same_time: z.object({
    net_sales: money,
    sales_count: z.number().int(),
  }),
  yesterday_same_time: z.object({
    net_sales: money,
    sales_count: z.number().int(),
  }),
  changes: z.object({
    net_sales: z.string().nullable(),
    sales_count: z.string().nullable(),
    net_sales_vs_yesterday: z.string().nullable(),
  }),
  attention: z.array(
    z.object({
      key: z.enum(attentionKeys),
      count: z.number().int(),
      branch_count: z.number().int().optional(),
      oldest_at: z.string().nullable().optional(),
      amount: nullableMoney.optional(),
      example: z
        .object({
          record_id: z.string(),
          branch_id: z.string().nullable(),
          branch_name: z.string().nullable(),
          label: z.string().nullable(),
          quantity: z.string().nullable(),
          unit: z.string().nullable(),
        })
        .nullable()
        .optional(),
    }),
  ),
  branches: z.array(
    z.object({
      branch_id: z.string(),
      branch_name: z.string(),
      status: z.string(),
      shift_id: z.string().nullable(),
      shift_number: z.number().int().nullable(),
      cashier_name: z.string().nullable(),
      opened_at: z.string().nullable(),
      sales_count: z.number().int(),
      net_sales: money,
      last_sale_at: z.string().nullable(),
      last_week_net_sales: money,
      net_sales_change: z.string().nullable(),
      yesterday_report_status: z
        .enum(["DRAFT", "SUBMITTED", "RETURNED", "APPROVED", "MISSING"])
        .nullable(),
    }),
  ),
  last_7_days: z.array(
    z.object({
      date: z.string(),
      sales_count: z.number().int(),
      net_sales: money,
      food_cost: nullableMoney,
      gross_profit: nullableMoney,
    }),
  ),
  top_products_today: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      quantity: z.string(),
      net_sales: money,
    }),
  ),
  hourly: z.array(
    z.object({
      hour: z.string(),
      sales_count: z.number().int(),
      net_sales: money,
      last_week_net_sales: money,
    }),
  ),
});

export type DashboardToday = z.infer<typeof dashboardTodaySchema>;
export type AttentionKey = (typeof attentionKeys)[number];
export type BranchToday = DashboardToday["branches"][number];
export type ReportProgress = z.infer<typeof reportProgressSchema>;
export type DashboardAttention = DashboardToday["attention"][number];
