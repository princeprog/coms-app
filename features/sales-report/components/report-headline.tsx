import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesReport } from "../schemas/sales-report.schema";
import {
  changeText,
  changeTone,
  count,
  percent,
  peso,
} from "../services/report-format";

type Card = {
  label: string;
  value: string;
  change?: string | null;
  unit?: string;
  risingIsBad?: boolean;
};

function Change({
  value,
  unit,
  risingIsBad,
}: {
  value?: string | null;
  unit?: string;
  risingIsBad?: boolean;
}) {
  const tone = changeTone(value ?? null, risingIsBad);
  const Icon =
    tone === "neutral" || value === null || Number(value) === 0
      ? Minus
      : Number(value) > 0
        ? ArrowUpRight
        : ArrowDownRight;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        tone === "good" && "text-emerald-700 dark:text-emerald-400",
        tone === "bad" && "text-red-700 dark:text-red-400",
        tone === "neutral" && "text-muted-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {changeText(value ?? null, unit)}
    </span>
  );
}

export function ReportHeadline({ report }: { report: SalesReport }) {
  const h = report.headline;
  const c = report.changes;
  const cards: Card[] = [
    { label: "Net sales", value: peso(h.net_sales), change: c.net_sales },
    { label: "Gross sales", value: peso(h.gross_sales), change: c.gross_sales },
    { label: "Sales", value: count(h.sales_count), change: c.sales_count },
    {
      label: "Average sale",
      value: peso(h.average_sale),
      change: c.average_sale,
    },
    ...(report.show_costs
      ? [
          {
            label: "Gross profit",
            value: peso(h.gross_profit),
            change: c.gross_profit,
          },
          {
            label: `Food cost · ${percent(h.food_cost_percent)}`,
            value: peso(h.food_cost),
            change: c.food_cost_percent_points,
            unit: " pts",
            risingIsBad: true,
          },
        ]
      : []),
    {
      label: "Voided sales",
      value: `${peso(h.void_amount)} · ${h.void_count}`,
      change: c.void_amount,
      risingIsBad: true,
    },
    { label: "Items sold", value: count(h.items_sold) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex min-w-0 flex-col gap-1 rounded-xl border bg-card px-4 py-3"
        >
          <dt className="text-sm text-muted-foreground">{card.label}</dt>
          <dd className="truncate text-xl font-semibold tracking-tight tabular-nums">
            {card.value}
          </dd>
          {"change" in card && (
            <dd>
              <Change
                value={card.change}
                unit={card.unit}
                risingIsBad={card.risingIsBad}
              />
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
