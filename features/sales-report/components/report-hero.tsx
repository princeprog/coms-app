import type { SalesReport } from "../schemas/sales-report.schema";
import {
  count,
  peso,
  previousLabel,
  rangeLabel,
} from "../services/report-format";
import { ReportChange } from "./report-change";
import { ReportTrendChart } from "./report-trend-chart";

/** Selected period beside the comparison period, as proportional bars. */
function PeriodComparison({ report }: { report: SalesReport }) {
  const rows = [
    {
      label: rangeLabel(report),
      value: report.headline.net_sales,
      current: true,
    },
    {
      label: previousLabel(report),
      value: report.previous.net_sales,
      current: false,
    },
  ];
  const max = Math.max(...rows.map((row) => Number(row.value)), 0);
  return (
    <ul
      aria-label="Net sales comparison"
      className="mt-auto flex flex-col gap-3"
    >
      {rows.map((row) => (
        <li key={row.label} className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={row.current ? "font-medium" : "text-muted-foreground"}
            >
              {row.label}
            </span>
            <span className="tabular-nums">{peso(row.value)}</span>
          </div>
          <div
            aria-hidden="true"
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={`h-full w-full origin-left rounded-full transition-transform duration-300 ease-out-quint motion-reduce:transition-none ${row.current ? "bg-[var(--chart-3)]" : "bg-[var(--chart-1)]"}`}
              style={{
                transform: `scaleX(${max ? Number(row.value) / max : 0})`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Net sales with its comparison and the day-by-day split. */
export function ReportHero({ report }: { report: SalesReport }) {
  const h = report.headline;
  return (
    <section
      aria-labelledby="report-net-sales"
      className="flex h-full min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 id="report-net-sales" className="text-sm text-muted-foreground">
            Net sales
          </h2>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {peso(h.net_sales)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <ReportChange value={report.changes.net_sales} pill />
            <span className="text-muted-foreground">
              {previousLabel(report)}: {peso(report.previous.net_sales)}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {count(h.sales_count)} {h.sales_count === 1 ? "sale" : "sales"} ·{" "}
          {count(h.items_sold)} items
        </p>
      </div>
      {report.daily.length > 1 ? (
        <ReportTrendChart daily={report.daily} showCosts={report.show_costs} />
      ) : (
        <PeriodComparison report={report} />
      )}
    </section>
  );
}
