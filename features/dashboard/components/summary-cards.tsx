import {
  Ban,
  Banknote,
  ReceiptText,
  Scale,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { MetricChange } from "@/components/shared/metric-change";
import { changeText, count, peso } from "@/lib/metric-format";
import { cn } from "@/lib/utils";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { weekdayShort } from "../services/dashboard-format";

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

const toneStyles: Record<Tone, string> = {
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

type Card = {
  label: string;
  value: string;
  icon: ReactNode;
  tone: Tone;
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
      icon: <Banknote />,
      tone: "emerald",
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
      icon: <ReceiptText />,
      tone: "sky",
      change: data.changes.sales_count,
      detail: `${lastWeek} at this time: ${count(data.last_week_same_time.sales_count)}`,
    },
    {
      label: "Average sale",
      value: peso(t.average_sale),
      icon: <Scale />,
      tone: "violet",
      detail: `${count(t.items_sold)} items sold`,
    },
    ...(data.show_costs
      ? [
          {
            label: "Gross profit",
            value: peso(t.gross_profit),
            icon: <TrendingUp />,
            tone: "amber" as const,
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
      icon: <Ban />,
      tone: "rose",
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
              "flex min-w-0 flex-col gap-1.5 rounded-xl border bg-card p-4 shadow-xs",
              card.wide && "col-span-2 md:col-span-1",
            )}
          >
            <dt className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
              {card.label}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                  toneStyles[card.tone],
                )}
              >
                {card.icon}
              </span>
            </dt>
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
