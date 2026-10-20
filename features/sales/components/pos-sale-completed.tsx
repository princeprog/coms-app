"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProductPrice } from "@/lib/format-currency";
import { calculateCashChange } from "../services/pos-cash";
import type { Sale } from "../types/sale.types";

export function PosSaleCompleted({
  sale,
  cash,
  amountReceived,
  onNewSale,
}: {
  sale: Sale;
  cash: boolean;
  amountReceived: string;
  onNewSale: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const change = cash
    ? calculateCashChange(amountReceived, sale.total_amount).change
    : null;

  useEffect(() => {
    heading.current?.focus();
  }, [sale.id]);

  return (
    <section
      id="pos-cart-panel"
      aria-labelledby="pos-completed-heading"
      className="flex min-w-0 scroll-mt-4 flex-col overflow-hidden rounded-xl border bg-card xl:sticky xl:top-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
    >
      <header className="flex flex-col items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-6 py-7 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-700 text-white dark:bg-emerald-600">
          <Check aria-hidden="true" className="size-6" strokeWidth={3} />
        </span>
        <h2
          id="pos-completed-heading"
          ref={heading}
          tabIndex={-1}
          className="rounded-sm text-2xl font-semibold tracking-tight text-emerald-950 outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-emerald-50"
        >
          Sale completed
        </h2>
        {sale.sale_reference && (
          <p className="text-sm font-medium text-emerald-800 tabular-nums dark:text-emerald-200">
            {sale.sale_reference}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1 text-center">
          <span className="text-sm text-muted-foreground">Sale total</span>
          <output
            aria-label="Confirmed total"
            className="text-4xl font-semibold tracking-tight wrap-anywhere tabular-nums"
          >
            {formatProductPrice(sale.total_amount)}
          </output>
        </div>
        <dl className="flex flex-col gap-3 border-y py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment method</dt>
            <dd className="text-right font-medium wrap-anywhere">
              {sale.tender_method}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Service</dt>
            <dd className="font-medium">
              {sale.service_type === "DINE_IN"
                ? "Dine-in"
                : sale.service_type === "TAKEAWAY"
                  ? "Takeout"
                  : "Not recorded"}
            </dd>
          </div>
          {cash && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount received</dt>
              <dd className="min-w-0 text-right font-medium wrap-anywhere tabular-nums">
                <output aria-label="Amount received">
                  {formatProductPrice(amountReceived)}
                </output>
              </dd>
            </div>
          )}
        </dl>
        {cash && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 p-4 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50">
            <span className="font-medium">Change due</span>
            <output
              aria-label="Change due"
              className="text-3xl font-semibold tracking-tight wrap-anywhere tabular-nums"
            >
              {change !== null ? formatProductPrice(change) : "—"}
            </output>
          </div>
        )}
        <Button
          type="button"
          className="h-12 w-full text-base"
          onClick={onNewSale}
        >
          New sale
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </section>
  );
}
