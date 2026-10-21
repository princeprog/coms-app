"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { peso } from "@/lib/metric-format";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { hourLabel } from "../services/dashboard-format";

/** Today's net sales per hour, with the same hours last week as a dashed line. */
export function HourlyTrend({
  hours,
  lastWeekLabel,
}: {
  hours: DashboardToday["hourly"];
  lastWeekLabel: string;
}) {
  const config = {
    net_sales: { label: "Today", color: "var(--chart-3)" },
    last_week_net_sales: {
      label: lastWeekLabel,
      color: "var(--muted-foreground)",
    },
  } satisfies ChartConfig;
  const data = hours.map((hour) => ({
    hour: hour.hour,
    net_sales: Number(hour.net_sales),
    last_week_net_sales: Number(hour.last_week_net_sales),
  }));
  return (
    <ChartContainer
      config={config}
      className="aspect-auto min-h-40 w-full flex-1"
    >
      <ComposedChart
        data={data}
        accessibilityLayer
        margin={{ left: 0, right: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          tickFormatter={hourLabel}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) =>
                hourLabel(String(payload?.[0]?.payload?.hour ?? value))
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
        <Bar
          dataKey="net_sales"
          fill="var(--color-net_sales)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Line
          dataKey="last_week_net_sales"
          type="monotone"
          stroke="var(--color-last_week_net_sales)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
