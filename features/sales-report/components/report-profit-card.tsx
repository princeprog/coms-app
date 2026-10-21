import { TriangleAlert } from "lucide-react";
import type { SalesReport } from "../schemas/sales-report.schema";
import { percent, peso } from "../services/report-format";
import { ReportChange } from "./report-change";

/** How net sales split into food cost and gross profit. */
export function ReportProfitCard({ report }: { report: SalesReport }) {
  const h = report.headline;
  const foodShare = Math.min(
    100,
    Math.max(0, Number(h.food_cost_percent ?? 0)),
  );
  const coverage = h.cost_coverage_percent;
  const partial = coverage !== null && Number(coverage) < 100;
  return (
    <section
      aria-labelledby="report-profit"
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <div>
        <h2 id="report-profit" className="text-sm text-muted-foreground">
          Gross profit
        </h2>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
          {peso(h.gross_profit)}
        </p>
        <div className="mt-2">
          <ReportChange value={report.changes.gross_profit} pill />
        </div>
      </div>
      <div
        role="img"
        aria-label={`Food cost is ${percent(h.food_cost_percent)} of net sales`}
        className="flex h-2.5 overflow-hidden rounded-full bg-[var(--chart-3)]"
      >
        <div
          className="h-full w-full origin-left bg-[var(--chart-1)] transition-transform duration-300 ease-out-quint motion-reduce:transition-none"
          style={{ transform: `scaleX(${foodShare / 100})` }}
        />
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-[var(--chart-1)]"
            />
            Food cost · {percent(h.food_cost_percent)}
          </dt>
          <dd className="flex items-center gap-2 font-medium tabular-nums">
            {peso(h.food_cost)}
            <ReportChange
              value={report.changes.food_cost_percent_points}
              unit=" pts"
              risingIsBad
            />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-[var(--chart-3)]"
            />
            Gross margin
          </dt>
          <dd className="font-medium tabular-nums">
            {h.food_cost_percent === null
              ? "—"
              : `${Math.round((100 - Number(h.food_cost_percent)) * 10) / 10}%`}
          </dd>
        </div>
      </dl>
      {partial && (
        <p
          role="note"
          className="mt-auto flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-px size-3.5 shrink-0"
          />
          <span>
            <span className="font-medium">
              Food cost covers {coverage}% of net sales.
            </span>{" "}
            Products without a recipe or with uncosted stock add no cost, so
            profit is overstated.
          </span>
        </p>
      )}
    </section>
  );
}
