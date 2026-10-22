import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { ShiftReport } from "../schemas/shift.schema";
import { formatPeso, shareOf } from "../services/shift-money";
import {
  plural,
  ShiftReportCard,
  ShiftReportEmpty,
  ShiftReportLine,
  SignedAmount,
} from "./shift-report-card";
import styles from "./shift-report.module.css";

type Share = { key: string; label: string; count: number; amount: string };

function ShareList({
  id,
  title,
  rows,
  total,
}: {
  id: string;
  title: string;
  rows: Share[];
  total: string;
}) {
  return (
    <section aria-labelledby={id} className="border-t px-5 py-4 sm:px-6">
      <h3 id={id} className="mb-3 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-3.5">
        {rows.map((row) => {
          const share = shareOf(row.amount, total);
          return (
            <li key={row.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 font-medium wrap-anywhere">
                  {row.label}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {plural(row.count, "sale")}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPeso(row.amount)}
                  <span className="ml-2 inline-block min-w-10 text-right text-muted-foreground">
                    {Math.round(share * 100)}%
                  </span>
                </span>
              </div>
              <div
                aria-hidden="true"
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn(
                    styles.bar,
                    "h-full rounded-full bg-foreground/70",
                  )}
                  style={{ "--share": share } as CSSProperties}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Gross to net, then how the net was paid and served. */
export function ShiftSalesBreakdown({ shift }: { shift: ShiftReport }) {
  const sales = shift.sales_summary;
  const services: Share[] = sales
    ? [
        {
          key: "dine-in",
          label: "Dine-in",
          count: sales.dine_in_count,
          amount: sales.dine_in_amount,
        },
        {
          key: "takeout",
          label: "Takeout",
          count: sales.takeaway_count,
          amount: sales.takeaway_amount,
        },
      ].filter((row) => row.count > 0)
    : [];
  return (
    <ShiftReportCard id="shift-sales-heading" title="Sales">
      {!sales ? (
        <ShiftReportEmpty>
          Sales totals are shown after you count the drawer.
        </ShiftReportEmpty>
      ) : sales.sales_count === 0 ? (
        <ShiftReportEmpty>
          {shift.status === "OPEN"
            ? "No sales yet in this shift."
            : "No sales were made in this shift."}
        </ShiftReportEmpty>
      ) : (
        <>
          <dl className="pb-2 text-sm">
            <ShiftReportLine
              label="Gross sales"
              hint={plural(sales.sales_count, "sale")}
              value={formatPeso(sales.gross_amount)}
            />
            {sales.voided_count > 0 && (
              <ShiftReportLine
                label="Voided"
                hint={plural(sales.voided_count, "sale")}
                value={<SignedAmount sign="−" value={sales.voided_amount} />}
              />
            )}
            <ShiftReportLine
              strong
              label="Net sales"
              hint={plural(sales.completed_count, "sale")}
              value={formatPeso(sales.net_amount)}
            />
          </dl>
          {shift.payments.length > 0 && (
            <ShareList
              id="shift-payments-heading"
              title="By payment method"
              total={sales.net_amount}
              rows={shift.payments.map((payment) => ({
                key: `${payment.tender_method}-${payment.payment_kind}`,
                label: payment.tender_method,
                count: payment.sales_count,
                amount: payment.amount,
              }))}
            />
          )}
          {services.length > 0 && (
            <ShareList
              id="shift-services-heading"
              title="By service"
              total={sales.net_amount}
              rows={services}
            />
          )}
        </>
      )}
    </ShiftReportCard>
  );
}
