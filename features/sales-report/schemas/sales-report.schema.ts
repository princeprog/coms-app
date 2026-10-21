import { z } from "zod";

const money = z.string();
const nullableMoney = z.string().nullable();
const range = z.object({ from: z.string(), to: z.string() });
const totals = z.object({
  gross_sales: money,
  net_sales: money,
  sales_count: z.number().int(),
  average_sale: nullableMoney,
  items_sold: z.string(),
  void_count: z.number().int(),
  void_amount: money,
  food_cost: nullableMoney,
  gross_profit: nullableMoney,
  food_cost_percent: z.string().nullable(),
  cost_coverage_percent: z.string().nullable(),
});
const profit = { food_cost: nullableMoney, gross_profit: nullableMoney };
const share = {
  sales_count: z.number().int(),
  amount: money,
  share_percent: z.string().nullable(),
};

export const reportPeriods = ["day", "week", "month"] as const;

export const salesReportSchema = z.object({
  period: z.enum(reportPeriods),
  period_range: range,
  range,
  previous_range: range,
  in_progress: z.boolean(),
  branch: z
    .object({ id: z.string(), name: z.string(), code: z.string().nullable() })
    .nullable(),
  scope_label: z.string(),
  branch_options: z.array(
    z.object({ id: z.string(), name: z.string(), status: z.string() }),
  ),
  show_costs: z.boolean(),
  headline: totals,
  previous: totals,
  changes: z.object({
    gross_sales: z.string().nullable(),
    net_sales: z.string().nullable(),
    sales_count: z.string().nullable(),
    average_sale: z.string().nullable(),
    void_amount: z.string().nullable(),
    gross_profit: z.string().nullable(),
    food_cost_percent_points: z.string().nullable(),
  }),
  cash: z.object({
    closed_shifts: z.number().int(),
    short_shifts: z.number().int(),
    over_shifts: z.number().int(),
    cash_difference: money,
    short_amount: money,
    over_amount: money,
  }),
  stock: z.object({
    approved_reports: z.number().int(),
    waste_value: nullableMoney,
    variance_value: nullableMoney,
  }),
  by_branch: z.array(
    z.object({
      branch_id: z.string(),
      branch_name: z.string(),
      sales_count: z.number().int(),
      net_sales: money,
      average_sale: nullableMoney,
      cash_difference: money,
      ...profit,
    }),
  ),
  by_payment: z.array(z.object({ name: z.string(), ...share })),
  by_service: z.array(z.object({ service_type: z.string(), ...share })),
  by_category: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      net_sales: money,
      share_percent: z.string().nullable(),
      ...profit,
    }),
  ),
  top_products: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      quantity: z.string(),
      net_sales: money,
      ...profit,
    }),
  ),
  daily: z.array(
    z.object({
      date: z.string(),
      sales_count: z.number().int(),
      net_sales: money,
      ...profit,
    }),
  ),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const salesReportQuerySchema = z.object({
  period: z.enum(reportPeriods).catch("week"),
  date: date.optional().catch(undefined),
  branch: z.uuid().optional().catch(undefined),
});

export type SalesReport = z.infer<typeof salesReportSchema>;
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type ReportPeriod = (typeof reportPeriods)[number];
