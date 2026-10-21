import { z } from "zod";

const money = z.string();
const percent = z.string().nullable();
const page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  });
const range = z.object({ from: z.string(), to: z.string() });

export const branchProfitRowSchema = z.object({
  branch_id: z.uuid().nullable(),
  branch_name: z.string(),
  sales_count: z.number().int(),
  net_sales: money,
  food_cost: money,
  gross_profit: money,
  food_cost_percent: percent,
  cost_coverage_percent: percent,
  waste_value: money,
  variance_value: money,
});
export const branchProfitSchema = z.object({
  range,
  totals: branchProfitRowSchema,
  branches: z.array(branchProfitRowSchema),
});
export const productProfitPageSchema = page(
  z.object({
    product_id: z.uuid(),
    product_name: z.string(),
    units_sold: z.string(),
    net_sales: money,
    food_cost: money,
    gross_profit: money,
    food_cost_percent: percent,
    fully_costed: z.boolean(),
  }),
).extend({ range });
export const productCostPageSchema = page(
  z.object({
    product_id: z.uuid(),
    product_name: z.string(),
    category_name: z.string(),
    price: money,
    service_types: z.array(z.string()),
    recipe_line_count: z.number().int(),
    dine_in_cost: money.nullable(),
    takeout_cost: money.nullable(),
    dine_in_margin: money.nullable(),
    takeout_margin: money.nullable(),
    lowest_margin_percent: percent,
    missing_cost_items: z.array(z.string()),
  }),
);
export const stockCostPageSchema = page(
  z.object({
    stock_item_id: z.uuid(),
    stock_item_name: z.string(),
    category: z.string(),
    unit: z.string(),
    average_unit_cost: money.nullable(),
    last_unit_cost: money.nullable(),
    last_received_at: z.string().nullable(),
    cost_source: z.enum(["RECEIPT", "MANUAL"]).nullable(),
    updated_at: z.string().nullable(),
  }),
);

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const costQuerySchema = z.object({
  view: z.enum(["profit", "products", "stock"]).catch("profit"),
  from: date.optional().catch(undefined),
  to: date.optional().catch(undefined),
  branch: z.uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1_000_000).catch(1),
  page_size: z.coerce
    .number()
    .refine((n) => [10, 30, 50].includes(n))
    .catch(10),
  search: z.string().max(100).catch(""),
  status: z.enum(["all", "incomplete"]).catch("all"),
  missing: z.enum(["true"]).optional().catch(undefined),
});
export const setStockCostSchema = z.object({
  unit_cost: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,4})?$/, "Enter a cost with up to 4 decimal places."),
  reason: z
    .string()
    .trim()
    .min(3, "Enter a reason of at least 3 characters.")
    .max(300),
});

export type CostQuery = z.infer<typeof costQuerySchema>;
export type BranchProfit = z.infer<typeof branchProfitSchema>;
export type BranchProfitRow = z.infer<typeof branchProfitRowSchema>;
export type ProductProfitPage = z.infer<typeof productProfitPageSchema>;
export type ProductCostPage = z.infer<typeof productCostPageSchema>;
export type StockCostPage = z.infer<typeof stockCostPageSchema>;
export type StockCostRow = StockCostPage["items"][number];
