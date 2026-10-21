"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SalesReport } from "../schemas/sales-report.schema";
import { peso, shortDate, weekdayDate } from "../services/report-format";

const config = {
  gross_profit: { label: "Gross profit", color: "var(--chart-3)" },
  food_cost: { label: "Food cost", color: "var(--chart-1)" },
  net_sales: { label: "Net sales", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Daily net sales, split into food cost and gross profit when costs show. */
export function ReportTrendChart({
  daily,
  showCosts,
}: {
  daily: SalesReport["daily"];
  showCosts: boolean;
}) {
  const data = daily.map((day) => ({
    date: day.date,
    net_sales: Number(day.net_sales),
    food_cost: Number(day.food_cost ?? 0),
    gross_profit: Number(day.gross_profit ?? 0),
  }));
  const keys = showCosts
    ? (["food_cost", "gross_profit"] as const)
    : (["net_sales"] as const);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {keys.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm"
              style={{ background: config[key].color }}
            />
            {config[key].label}
          </span>
        ))}
      </figcaption>
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <BarChart data={data} accessibilityLayer margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={12}
            tickFormatter={shortDate}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltipContent
                labelFormatter={(value, payload) =>
                  `${weekdayDate(String(payload?.[0]?.payload?.date ?? value))} · ${peso(String(payload?.[0]?.payload?.net_sales?.toFixed(2) ?? "0"))}`
                }
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {peso(Number(value).toFixed(2))}
                    </span>
                  </span>
                )}
              />
            }
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="sales"
              fill={`var(--color-${key})`}
              radius={index === keys.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
              maxBarSize={56}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </figure>
  );
}
