import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "../types/daily-report.types";
import {
  countFieldError,
  type CountField,
} from "../services/daily-report-count-validation";
import type { CountChange } from "./daily-report-count-views";
import { DailyReportDecimalField } from "./daily-report-input-field";

const fields = {
  physical_closing_quantity: { label: "Physical count", signed: false },
  waste_quantity: { label: "Waste", signed: false },
  adjustment_quantity: { label: "Adjustment", signed: true },
} as const;

export type QuantityField = keyof typeof fields;

/** One quantity input; the visible label is optional because table headers name the column. */
export function DailyReportCountInput({
  item,
  values,
  field,
  pending,
  attempted,
  idPrefix,
  showLabel,
  onChange,
}: {
  item: DailyReportItem;
  values: DailyReportDraftItem;
  field: QuantityField;
  pending: boolean;
  attempted: boolean;
  idPrefix: string;
  showLabel: boolean;
  onChange: CountChange;
}) {
  const { label, signed } = fields[field];
  const context = ` for ${item.stock_item_name} (${item.unit})`;
  return (
    <DailyReportDecimalField
      id={`${idPrefix}-${field}-${item.stock_item_id}`}
      label={
        <>
          {label}
          <span className="sr-only">{context}</span>
        </>
      }
      labelClassName={
        showLabel ? "text-xs font-medium text-muted-foreground" : "sr-only"
      }
      unit={item.unit}
      value={values[field]}
      signed={signed}
      disabled={pending}
      error={attempted ? countFieldError(values, field as CountField) : null}
      onChange={(value) => onChange(item.stock_item_id, field, value)}
    />
  );
}
