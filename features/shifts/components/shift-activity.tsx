import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { ShiftDetail } from "../schemas/shift.schema";
import { formatPeso } from "../services/shift-money";
import { shiftTime } from "../services/shift-time";

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">{title}</h2>
      {children ?? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

function Row({
  left,
  sub,
  right,
}: {
  left: ReactNode;
  sub?: ReactNode;
  right: ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium wrap-anywhere">{left}</p>
        {sub && (
          <p className="mt-0.5 text-xs text-muted-foreground wrap-anywhere">
            {sub}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right tabular-nums">{right}</div>
    </li>
  );
}

export function ShiftActivity({ shift }: { shift: ShiftDetail }) {
  const totals = shift.totals;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section
        title="Sales"
        empty="Sales totals appear after the shift closes."
      >
        {!shift.cash_hidden && (
          <ul className="divide-y">
            {shift.payments.map((payment) => (
              <Row
                key={`${payment.tender_method}-${payment.payment_kind}`}
                left={payment.tender_method}
                sub={`${payment.sales_count} ${payment.sales_count === 1 ? "sale" : "sales"}`}
                right={formatPeso(payment.amount)}
              />
            ))}
            {shift.payments.length === 0 && (
              <Row left="No completed sales" right="" />
            )}
            <Row
              left="Cash refunds"
              sub={`${totals.voids_count} voided`}
              right={`−${formatPeso(totals.cash_refunds_amount)}`}
            />
          </ul>
        )}
      </Section>
      <Section title="Cash in and out" empty="No cash added or removed.">
        {shift.cash_movements.length > 0 && (
          <ul className="divide-y">
            {shift.cash_movements.map((movement) => (
              <Row
                key={movement.id}
                left={
                  <span className="inline-flex items-center gap-1.5">
                    {movement.direction === "OUT" ? (
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 text-red-600"
                      />
                    ) : (
                      <ArrowDownLeft
                        aria-hidden="true"
                        className="size-4 text-emerald-600"
                      />
                    )}
                    {movement.reason}
                  </span>
                }
                sub={`${movement.actor_name} · ${shiftTime(movement.created_at)}`}
                right={
                  <span
                    className={
                      movement.direction === "OUT"
                        ? "text-red-700 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    }
                  >
                    {movement.direction === "OUT" ? "−" : "+"}
                    {formatPeso(movement.amount)}
                  </span>
                }
              />
            ))}
          </ul>
        )}
      </Section>
      {shift.voids.length > 0 && (
        <Section title="Voids during this shift">
          <ul className="divide-y">
            {shift.voids.map((entry) => (
              <Row
                key={entry.sale_id}
                left={`${entry.sale_reference} · ${entry.payment_kind === "CASH" ? "Cash" : "Non-cash"}`}
                sub={`${entry.reason ?? "No reason"} · ${entry.actor_name} · ${shiftTime(entry.created_at)}`}
                right={entry.amount === null ? "—" : formatPeso(entry.amount)}
              />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
