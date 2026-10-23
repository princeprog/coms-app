import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { MetricChange } from "@/components/shared/metric-change";
import { changeText, count, peso } from "@/lib/metric-format";
import { cn } from "@/lib/utils";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { weekdayShort } from "../services/dashboard-format";
import { TodayChart } from "./today-chart";
import { salesReportHref } from "../services/dashboard-links";

/** Today's sales so far against the same weekday last week. */
export function TodayHero({
  data,
  canOpenReport,
  branchId,
}: {
  data: DashboardToday;
  canOpenReport: boolean;
  branchId?: string;
}) {
  const t = data.today;
  const coverage = t.cost_coverage_percent;
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
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <MetricChange
              value={data.changes.net_sales}
              pill
              empty="No sales last week"
            />
            <span className="text-muted-foreground">
              Last {weekdayShort(data.business_date)} at this time:{" "}
              {peso(data.last_week_same_time.net_sales)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Yesterday at this time: {peso(data.yesterday_same_time.net_sales)}
            {data.changes.net_sales_vs_yesterday !== null &&
              ` (${changeText(data.changes.net_sales_vs_yesterday)})`}
          </p>
        </div>
        {canOpenReport && (
          <Link
            href={salesReportHref(branchId)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sales report
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      <TodayChart data={data} />
      <div className="flex flex-col gap-2">
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
        {data.show_costs && coverage !== null && Number(coverage) < 100 && (
          <p
            role="note"
            className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0"
            />
            <span>
              <span className="font-medium">
                Food cost covers {coverage}% of today&apos;s sales.
              </span>{" "}
              Products without a recipe or with uncosted stock add no cost, so
              gross profit is overstated.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
