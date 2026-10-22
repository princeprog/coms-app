import type {
  DailyReportDraftItem,
  DailyReportItem,
} from "../types/daily-report.types";
import { countFieldError } from "../services/daily-report-count-validation";
import { isNonZeroQuantity } from "../services/daily-report-quantity";
import type { CountChange } from "./daily-report-count-views";
import { DailyReportReasonField } from "./daily-report-input-field";

/** Reasons appear only when waste or an adjustment needs one. */
export function DailyReportCountReasons({
  item,
  values,
  editable,
  pending,
  attempted,
  idPrefix,
  onChange,
}: {
  item: DailyReportItem;
  values: DailyReportDraftItem;
  editable: boolean;
  pending: boolean;
  attempted: boolean;
  idPrefix: string;
  onChange: CountChange;
}) {
  const id = item.stock_item_id;
  const name = item.stock_item_name;
  if (!editable) {
    const notes = [
      item.waste_reason && { label: "Waste reason", text: item.waste_reason },
      item.adjustment_reason && {
        label: "Adjustment reason",
        text: item.adjustment_reason,
      },
    ].filter((note): note is { label: string; text: string } => Boolean(note));
    if (!notes.length) return null;
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {notes.map((note) => (
          <div
            key={note.label}
            className="rounded-lg bg-muted/60 px-3 py-2 text-sm"
          >
            <p className="text-xs text-muted-foreground">{note.label}</p>
            <p className="mt-0.5 whitespace-pre-wrap wrap-anywhere">
              {note.text}
            </p>
          </div>
        ))}
      </div>
    );
  }
  const waste = isNonZeroQuantity(values.waste_quantity);
  const adjustment = isNonZeroQuantity(values.adjustment_quantity);
  if (!waste && !adjustment) return null;
  const error = (field: "waste_reason" | "adjustment_reason") =>
    attempted ? countFieldError(values, field) : null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {waste && (
        <DailyReportReasonField
          id={`${idPrefix}-waste-reason-${id}`}
          label={
            <>
              Reason for waste<span className="sr-only"> for {name}</span>
            </>
          }
          value={values.waste_reason}
          disabled={pending}
          error={error("waste_reason")}
          onChange={(value) => onChange(id, "waste_reason", value)}
        />
      )}
      {adjustment && (
        <DailyReportReasonField
          id={`${idPrefix}-adjustment-reason-${id}`}
          label={
            <>
              Reason for adjustment<span className="sr-only"> for {name}</span>
            </>
          }
          value={values.adjustment_reason}
          disabled={pending}
          error={error("adjustment_reason")}
          onChange={(value) => onChange(id, "adjustment_reason", value)}
        />
      )}
    </div>
  );
}
