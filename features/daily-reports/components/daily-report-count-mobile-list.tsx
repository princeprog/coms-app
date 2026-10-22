import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { withUnit } from "../services/daily-report-quantity";
import { DailyReportCountInput } from "./daily-report-count-inputs";
import { DailyReportCountReasons } from "./daily-report-count-reasons";
import styles from "./daily-report-counts.module.css";
import { rowState, type CountViewProps } from "./daily-report-count-views";
import { DailyReportLedger } from "./daily-report-ledger";
import { DailyReportVariance } from "./daily-report-variance";

function Value({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value ?? "Not counted"}</dd>
    </div>
  );
}

export function DailyReportCountMobileList(props: CountViewProps) {
  const { editable, pending, attempted, onChange } = props;
  return (
    <ul aria-label="Stock count items" className="divide-y xl:hidden">
      {props.items.map((item) => {
        const { values, changed } = rowState(props, item);
        if (!values) return null;
        const input = (
          field:
            | "physical_closing_quantity"
            | "waste_quantity"
            | "adjustment_quantity",
        ) => (
          <DailyReportCountInput
            item={item}
            values={values}
            field={field}
            pending={pending}
            attempted={attempted}
            idPrefix="mobile"
            showLabel
            onChange={onChange}
          />
        );
        return (
          <li key={item.id} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium wrap-anywhere">
                  {item.stock_item_name}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  Expected {withUnit(item.expected_closing_quantity, item.unit)}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <DailyReportVariance
                  value={item.variance_quantity}
                  unit={item.unit}
                  stale={changed}
                />
              </div>
            </div>
            {editable ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  {input("physical_closing_quantity")}
                </div>
                {input("waste_quantity")}
                {input("adjustment_quantity")}
              </div>
            ) : (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Value
                  label="Physical count"
                  value={withUnit(item.physical_closing_quantity, item.unit)}
                />
                <Value
                  label="Waste"
                  value={withUnit(item.waste_quantity, item.unit)}
                />
                <Value
                  label="Adjustment"
                  value={withUnit(item.adjustment_quantity, item.unit)}
                />
              </dl>
            )}
            <DailyReportCountReasons
              item={item}
              values={values}
              editable={editable}
              pending={pending}
              attempted={attempted}
              idPrefix="mobile"
              onChange={onChange}
            />
            <details className={cn(styles.ledger, "group text-sm")}>
              <summary className="flex min-h-9 w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                Stock movements
                <ChevronDown
                  aria-hidden="true"
                  className={cn(styles.chevron, "size-4 group-open:rotate-180")}
                />
              </summary>
              <div className="mt-2 rounded-lg bg-muted/40 px-4 py-3">
                <DailyReportLedger item={item} />
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
