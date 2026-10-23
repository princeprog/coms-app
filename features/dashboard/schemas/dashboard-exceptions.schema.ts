import { z } from "zod";

const count = z.number().int();

export const dashboardExceptionsSchema = z.object({
  week_starts: z.array(z.string()),
  access: z.object({
    shortages: z.boolean(),
    shortage_values: z.boolean(),
    cash: z.boolean(),
    receiving: z.boolean(),
    cashiers: z.boolean(),
  }),
  branches: z.array(
    z.object({
      branch_id: z.string(),
      branch_name: z.string(),
      weeks: z.array(
        z.object({
          week_start: z.string(),
          shortage_lines: count.nullable(),
          uncosted_shortage_lines: count.nullable(),
          shortage_value: z.string().nullable(),
          cash_short_shifts: count.nullable(),
          cash_short_amount: z.string().nullable(),
          receiving_differences: count.nullable(),
          void_count: count,
          void_amount: z.string(),
        }),
      ),
    }),
  ),
  cashiers: z
    .object({
      total: count,
      items: z.array(
        z.object({
          user_id: z.string(),
          full_name: z.string(),
          branches: z.array(z.string()),
          shifts: count,
          short_shifts: count,
          short_amount: z.string(),
          over_shifts: count,
          over_amount: z.string(),
          sales_count: count,
          void_count: count,
          void_amount: z.string(),
        }),
      ),
    })
    .nullable(),
});

export type DashboardExceptions = z.infer<typeof dashboardExceptionsSchema>;
export type BranchExceptions = DashboardExceptions["branches"][number];
export type ExceptionWeek = BranchExceptions["weeks"][number];
export type CashierExceptions = NonNullable<
  DashboardExceptions["cashiers"]
>["items"][number];
