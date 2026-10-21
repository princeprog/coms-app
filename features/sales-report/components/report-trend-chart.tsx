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
  net_sales: { label: "Net sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ReportTrendChart({ daily }: { daily: SalesReport["daily"] }) {
  const data = daily.map((day) => ({
    date: day.date,
    net_sales: Number(day.net_sales),
  }));
  return (
    <section aria-labelledby="report-trend" className="rounded-xl border p-4">
      <h2 id="report-trend" className="mb-3 font-semibold">
        Net sales by day
      </h2>
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tickFormatter={shortDate}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => weekdayDate(String(value))}
                formatter={(value) => peso(Number(value).toFixed(2))}
              />
            }
          />
          <Bar dataKey="net_sales" fill="var(--color-net_sales)" radius={4} />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
