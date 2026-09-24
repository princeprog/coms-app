import { DailyReportMetric } from "./daily-report-metric";
import { DailyReportReasonField } from "./daily-report-input-field";
import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "@/features/daily-reports/types/daily-report.types";

export function DailyReportCountDetails({
  item,
  values,
  editable,
  pending,
  idSuffix,
  onChange,
}: {
  item: DailyReportItem;
  values: DailyReportDraftItem;
  editable: boolean;
  pending: boolean;
  idSuffix: "desktop" | "mobile";
  onChange: (
    stockItemId: string,
    field: keyof DailyReportDraftItem,
    value: string,
  ) => void;
}) {
  const id = item.stock_item_id;
  return (
    <details className="mt-2 rounded-md border border-border/70 px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Ledger details and reasons for {item.stock_item_name}
      </summary>
      <div className="mt-3 grid gap-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
          <DailyReportMetric
            label="Opening stock"
            value={item.opening_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Receipts"
            value={item.receipt_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Sale consumption"
            value={item.sale_consumption_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Sale void reversals"
            value={item.sale_void_reversal_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Ledger adjustments"
            value={item.ledger_adjustment_quantity}
            unit={item.unit}
          />
          <DailyReportMetric
            label="Ledger closing"
            value={item.ledger_closing_quantity}
            unit={item.unit}
          />
        </dl>
        {editable ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DailyReportReasonField
              id={`${idSuffix}-waste-reason-${id}`}
              label={`Reason for waste for ${item.stock_item_name}`}
              value={values.waste_reason}
              disabled={pending}
              onChange={(value) => onChange(id, "waste_reason", value)}
            />
            <DailyReportReasonField
              id={`${idSuffix}-adjustment-reason-${id}`}
              label={`Reason for adjustment for ${item.stock_item_name}`}
              value={values.adjustment_reason}
              disabled={pending}
              onChange={(value) => onChange(id, "adjustment_reason", value)}
            />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
            <DailyReportMetric
              label="Waste"
              value={item.waste_quantity}
              unit={item.unit}
            />
            <DailyReportMetric label="Waste reason" value={item.waste_reason} />
            <DailyReportMetric
              label="Justified adjustment"
              value={item.adjustment_quantity}
              unit={item.unit}
            />
            <DailyReportMetric
              label="Adjustment reason"
              value={item.adjustment_reason}
            />
          </dl>
        )}
      </div>
    </details>
  );
}
