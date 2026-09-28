"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";

const chartConfig = {
  completed: { label: "Completed sales", color: "var(--chart-1)" },
  voided: { label: "Voided sales", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function DashboardSalesTrend({ data }: { data: DashboardData }) {
  const chartData = data.sales_trend.map((day) => ({
    ...day,
    completed: Number(day.completed_sales_amount),
    voided: Number(day.voided_sales_amount),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales trend</CardTitle>
        <CardDescription>
          Completed and voided sales by Manila business date. Amounts are shown
          without a currency symbol.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tickFormatter={(value: string) =>
                new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PH", {
                  timeZone: "UTC",
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("en-PH", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => String(value)}
                  formatter={(value) =>
                    new Intl.NumberFormat("en-PH", {
                      maximumFractionDigits: 2,
                    }).format(Number(value))
                  }
                />
              }
            />
            <Area
              dataKey="completed"
              type="monotone"
              fill="var(--color-completed)"
              fillOpacity={0.2}
              stroke="var(--color-completed)"
              strokeWidth={2}
            />
            <Area
              dataKey="voided"
              type="monotone"
              fill="var(--color-voided)"
              fillOpacity={0.08}
              stroke="var(--color-voided)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
