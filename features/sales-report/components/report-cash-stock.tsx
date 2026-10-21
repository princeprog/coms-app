import { cn } from "@/lib/utils";
import type { SalesReport } from "../schemas/sales-report.schema";
import { count, peso } from "../services/report-format";

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums", className)}>{value}</dd>
    </div>
  );
}

const tone = (value: string | null) =>
  Number(value) < 0
    ? "text-red-700 dark:text-red-400"
    : Number(value) > 0
      ? "text-amber-700 dark:text-amber-400"
      : undefined;

/** Register cash results and stock losses for the period. */
export function ReportCashAndStock({ report }: { report: SalesReport }) {
  const { cash, stock } = report;
  const shifts = (n: number) => `${n} ${n === 1 ? "shift" : "shifts"}`;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        aria-labelledby="report-cash"
        className="rounded-xl border bg-card p-5"
      >
        <h2 id="report-cash" className="text-sm text-muted-foreground">
          Cash over/short
        </h2>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
            tone(cash.cash_difference),
          )}
        >
          {peso(cash.cash_difference)}
        </p>
        <dl className="mt-3 divide-y">
          <Row label="Closed shifts" value={count(cash.closed_shifts)} />
          <Row
            label={`Short · ${shifts(cash.short_shifts)}`}
            value={peso(cash.short_amount)}
            className={tone(cash.short_amount)}
          />
          <Row
            label={`Over · ${shifts(cash.over_shifts)}`}
            value={peso(cash.over_amount)}
            className={tone(cash.over_amount)}
          />
        </dl>
      </section>
      <section
        aria-labelledby="report-stock"
        className="rounded-xl border bg-card p-5"
      >
        <h2 id="report-stock" className="text-sm text-muted-foreground">
          {report.show_costs ? "Waste" : "Daily reports"}
        </h2>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {report.show_costs
            ? peso(stock.waste_value)
            : count(stock.approved_reports)}
        </p>
        <dl className="mt-3 divide-y">
          {report.show_costs && (
            <Row
              label="Count variance value"
              value={peso(stock.variance_value)}
              className={tone(stock.variance_value)}
            />
          )}
          <Row
            label="Approved daily reports"
            value={count(stock.approved_reports)}
          />
        </dl>
      </section>
    </div>
  );
}
