import type { ExpensePage } from "../schemas/expense.schema";
import { cents, pesos } from "../services/expense-format";

export function ExpenseSummary({ data }: { data: ExpensePage }) {
  return (
    <section aria-label="Recorded spending summary" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Recorded spending", data.summary.recorded_spending],
          ["Operating expenses", data.summary.operating_expenses],
          ["Stock purchases", data.summary.stock_purchases],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {pesos(value)}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Purchase value plus operating expenses for the applied filters. Voided
        entries are excluded. These totals do not represent cash paid or net
        profit.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="By location" rows={data.by_location} />
        <Breakdown title="By category" rows={data.by_category} />
      </div>
    </section>
  );
}
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: ExpensePage["by_location"];
}) {
  const max = rows.reduce(
    (value, row) => (cents(row.amount) > value ? cents(row.amount) : value),
    BigInt(1),
  );
  return (
    <details className="rounded-lg border p-3" open>
      <summary className="cursor-pointer text-sm font-medium">{title}</summary>
      <div className="mt-3 max-h-48 space-y-3 overflow-auto">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="space-y-1">
              <div className="flex justify-between gap-2 text-xs">
                <span>{row.name}</span>
                <span className="tabular-nums">{pesos(row.amount)}</span>
              </div>
              <meter
                className="h-2 w-full accent-primary"
                min={0}
                max={100}
                value={Number((cents(row.amount) * BigInt(100)) / max)}
                aria-label={`${row.name}: ${pesos(row.amount)}`}
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            No recorded spending in this selection.
          </p>
        )}
      </div>
    </details>
  );
}
