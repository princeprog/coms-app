"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { peso } from "@/lib/metric-format";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { businessDayLabel } from "../services/dashboard-format";

const config = {
  net_sales: { label: "Net sales", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Net sales for the last seven business days; today stands out. Sits inside the today panel and grows to fill it. */
export function WeekTrend({ days }: { days: DashboardToday["last_7_days"] }) {
  const data = days.map((day) => ({
    date: day.date,
    net_sales: Number(day.net_sales),
  }));
  const total = days.reduce((sum, day) => sum + Number(day.net_sales), 0);
  return (
    <section
      aria-labelledby="dashboard-week"
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="dashboard-week" className="text-sm font-medium">
          Last 7 days
        </h3>
        <span className="text-sm text-muted-foreground tabular-nums">
          {peso(total.toFixed(2))}
        </span>
      </div>
      <ChartContainer
        config={config}
        className="aspect-auto min-h-40 w-full flex-1"
      >
        <BarChart data={data} accessibilityLayer margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) =>
              businessDayLabel(value).split(",")[0]
            }
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltipContent
                labelFormatter={(value, payload) =>
                  businessDayLabel(String(payload?.[0]?.payload?.date ?? value))
                }
                formatter={(value) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">Net sales</span>
                    <span className="font-medium tabular-nums">
                      {peso(Number(value).toFixed(2))}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="net_sales"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={false}
          >
            {data.map((day, index) => (
              <Cell
                key={day.date}
                fill={
                  index === data.length - 1
                    ? "var(--chart-3)"
                    : "var(--chart-1)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </section>
  );
}
