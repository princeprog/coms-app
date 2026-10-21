import type { SalesReport } from "../schemas/sales-report.schema";
import { count, peso, previousLabel } from "../services/report-format";
import { ReportChange } from "./report-change";
import { ReportTrendChart } from "./report-trend-chart";

/** Net sales with its comparison and the day-by-day split. */
export function ReportHero({ report }: { report: SalesReport }) {
  const h = report.headline;
  return (
    <section
      aria-labelledby="report-net-sales"
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
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
      {report.daily.length > 1 && (
        <ReportTrendChart daily={report.daily} showCosts={report.show_costs} />
      )}
    </section>
  );
}
