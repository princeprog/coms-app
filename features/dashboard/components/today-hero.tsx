import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MetricChange } from "@/components/shared/metric-change";
import { count, peso } from "@/lib/metric-format";
import { cn } from "@/lib/utils";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { WeekTrend } from "./week-trend";

/** Today's sales so far against yesterday at the same time. */
export function TodayHero({
  data,
  canOpenReport,
}: {
  data: DashboardToday;
  canOpenReport: boolean;
}) {
  const t = data.today;
  const stats = [
    {
      label: "Sales",
      value: count(t.sales_count),
      change: data.changes.sales_count,
    },
    { label: "Average sale", value: peso(t.average_sale) },
    { label: "Items sold", value: count(t.items_sold) },
    ...(data.show_costs
      ? [{ label: "Gross profit", value: peso(t.gross_profit) }]
      : []),
    { label: "Voided", value: count(t.void_count) },
  ];
  return (
    <section
      aria-labelledby="dashboard-today"
      className="flex h-full min-w-0 flex-col gap-5 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="dashboard-today" className="text-sm text-muted-foreground">
            Today so far
          </h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {peso(t.net_sales)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <MetricChange
              value={data.changes.net_sales}
              pill
              empty="No sales yesterday"
            />
            <span className="text-muted-foreground">
              Yesterday at this time: {peso(data.yesterday_same_time.net_sales)}
            </span>
          </div>
        </div>
        {canOpenReport && (
          <Link
            href="/sales-report?period=day"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sales report
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      <WeekTrend days={data.last_7_days} />
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex min-w-0 flex-col gap-0.5 bg-card px-3 py-2.5",
              // An odd last cell spans the row so the two-column grid has no gap.
              index === stats.length - 1 &&
                stats.length % 2 === 1 &&
                "col-span-2 lg:col-span-1",
            )}
          >
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="truncate text-base font-semibold tabular-nums">
              {stat.value}
            </dd>
            {"change" in stat && (
              <dd>
                <MetricChange value={stat.change ?? null} empty="—" />
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
