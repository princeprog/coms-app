import type { SalesReport } from "../schemas/sales-report.schema";
import { count, peso } from "../services/report-format";
import { ReportChange } from "./report-change";

/** Supporting numbers in one row, separated by hairlines. */
export function ReportStatStrip({ report }: { report: SalesReport }) {
  const h = report.headline;
  const c = report.changes;
  const stats = [
    { label: "Gross sales", value: peso(h.gross_sales), change: c.gross_sales },
    { label: "Sales", value: count(h.sales_count), change: c.sales_count },
    {
      label: "Average sale",
      value: peso(h.average_sale),
      change: c.average_sale,
    },
    {
      label: "Voided sales",
      value: peso(h.void_amount),
      note: `${h.void_count} ${h.void_count === 1 ? "sale" : "sales"}`,
      change: c.void_amount,
      risingIsBad: true,
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-w-0 flex-col gap-1 bg-card px-4 py-3"
        >
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="truncate text-xl font-semibold tracking-tight tabular-nums">
            {stat.value}
            {stat.note && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {stat.note}
              </span>
            )}
          </dd>
          <dd>
            <ReportChange value={stat.change} risingIsBad={stat.risingIsBad} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
