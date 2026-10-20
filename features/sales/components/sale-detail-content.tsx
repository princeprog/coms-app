import { format, parseISO } from "date-fns";
import { formatProductPrice } from "@/lib/format-currency";
import type { Sale } from "@/features/sales/types/sale.types";

const serviceLabels = { DINE_IN: "Dine-in", TAKEAWAY: "Takeout" } as const;

export function SaleDetailContent({ sale }: { sale: Sale }) {
  const voided = sale.status === "VOIDED";
  const voidEvent = sale.events.findLast(
    (event) => event.event_type === "VOIDED",
  );
  const facts = [
    { label: "Cashier", value: sale.cashier_name ?? "Staff member" },
    { label: "Payment", value: sale.tender_method },
    {
      label: "Service",
      value: sale.service_type
        ? serviceLabels[sale.service_type]
        : "Not recorded",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex min-w-0 flex-col gap-1 px-4 py-3"
          >
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="truncate text-sm font-medium" title={fact.value}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="sale-items-heading" className="flex flex-col">
        <h3
          id="sale-items-heading"
          className="pb-2 text-xs font-medium text-muted-foreground"
        >
          Items ({sale.items.length})
        </h3>
        <ul className="divide-y border-y">
          {sale.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium wrap-anywhere">
                  {item.product_name_snapshot}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.quantity} × {formatProductPrice(item.unit_price)}
                </span>
              </div>
              <span className="shrink-0 font-medium tabular-nums">
                {formatProductPrice(item.line_total)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-4 pt-4">
          <span className="text-base font-semibold">Total</span>
          <span
            className={
              voided
                ? "text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums line-through"
                : "text-2xl font-semibold tracking-tight tabular-nums"
            }
          >
            {formatProductPrice(sale.total_amount)}
          </span>
        </div>
      </section>

      {voided && (
        <section
          aria-label="Void details"
          className="flex flex-col gap-1 rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/60 dark:bg-red-950/30"
        >
          <p className="font-medium text-red-800 dark:text-red-200">
            Voided
            {voidEvent &&
              ` by ${voidEvent.actor_name ?? "a staff member"} · ${format(parseISO(voidEvent.created_at), "MMM d, h:mm a")}`}
          </p>
          {voidEvent?.reason && (
            <p className="text-red-900/80 wrap-anywhere dark:text-red-100/80">
              {voidEvent.reason}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
