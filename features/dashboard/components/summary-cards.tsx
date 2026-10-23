import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { MetricChange } from "@/components/shared/metric-change";
import { changeText, count, peso } from "@/lib/metric-format";
import { cn } from "@/lib/utils";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { weekdayShort } from "../services/dashboard-format";

type Card = {
  label: string;
  value: string;
  change?: string | null;
  detail?: ReactNode;
  wide?: boolean;
};

function margin(profit: string | null, sales: string) {
  if (profit === null || !Number(sales)) return null;
  return `${((Number(profit) / Number(sales)) * 100).toFixed(1)}% margin`;
}

/** Today's headline figures, compared with the same weekday last week. */
export function SummaryCards({ data }: { data: DashboardToday }) {
  const t = data.today;
  const lastWeek = `Last ${weekdayShort(data.business_date)}`;
  const coverage = t.cost_coverage_percent;
  const cards: Card[] = [
    {
      label: "Net sales",
      value: peso(t.net_sales),
      change: data.changes.net_sales,
      wide: true,
      detail: (
        <>
          <span className="block">
            {lastWeek} at this time: {peso(data.last_week_same_time.net_sales)}
          </span>
          <span className="block">
            Yesterday at this time: {peso(data.yesterday_same_time.net_sales)}
            {data.changes.net_sales_vs_yesterday !== null &&
              ` (${changeText(data.changes.net_sales_vs_yesterday)})`}
          </span>
        </>
      ),
    },
    {
      label: "Sales",
      value: count(t.sales_count),
      change: data.changes.sales_count,
      detail: `${lastWeek} at this time: ${count(data.last_week_same_time.sales_count)}`,
    },
    {
      label: "Average sale",
      value: peso(t.average_sale),
      detail: `${count(t.items_sold)} items sold`,
    },
    ...(data.show_costs
      ? [
          {
            label: "Gross profit",
            value: peso(t.gross_profit),
            detail: [
              margin(t.gross_profit, t.net_sales),
              `Food cost ${peso(t.food_cost)}`,
            ]
              .filter(Boolean)
              .join(" · "),
          },
        ]
      : []),
    {
      label: "Voided",
      value: count(t.void_count),
      detail: "Sales voided today",
    },
  ];
  return (
    <section aria-labelledby="dashboard-today" className="flex flex-col gap-2">
      <h2 id="dashboard-today" className="sr-only">
        Today so far
      </h2>
      <dl
        className={cn(
          "grid grid-cols-2 gap-3 md:grid-cols-3",
          cards.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-4",
              card.wide && "col-span-2 md:col-span-1",
            )}
          >
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="truncate text-2xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </span>
              {card.change !== undefined && (
                <MetricChange
                  value={card.change}
                  pill
                  empty="No sales last week"
                />
              )}
            </dd>
            {card.detail && (
              <dd className="text-xs text-muted-foreground">{card.detail}</dd>
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
    </section>
  );
}
