import { z } from "zod";

export const attentionKeys = [
  "deliveries_overdue",
  "open_discrepancies",
  "shifts_open_past_day",
  "cash_shortages",
  "stock_below_zero",
  "reports_missing",
  "reports_returned",
  "reports_to_review",
  "late_counts_to_review",
  "shifts_to_review",
  "deliveries_in_transit",
  "products_incomplete_costs",
] as const;

const money = z.string();
const nullableMoney = z.string().nullable();

export const dashboardTodaySchema = z.object({
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
  }),
  yesterday_same_time: z.object({
    net_sales: money,
    sales_count: z.number().int(),
  }),
  changes: z.object({
    net_sales: z.string().nullable(),
    sales_count: z.string().nullable(),
  }),
  attention: z.array(
    z.object({ key: z.enum(attentionKeys), count: z.number().int() }),
  ),
  branches: z.array(
    z.object({
      branch_id: z.string(),
      branch_name: z.string(),
      status: z.string(),
      shift_number: z.number().int().nullable(),
      cashier_name: z.string().nullable(),
      opened_at: z.string().nullable(),
      sales_count: z.number().int(),
      net_sales: money,
      last_sale_at: z.string().nullable(),
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
});

export type DashboardToday = z.infer<typeof dashboardTodaySchema>;
export type AttentionKey = (typeof attentionKeys)[number];
export type BranchToday = DashboardToday["branches"][number];
