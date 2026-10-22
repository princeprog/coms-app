import type { DailyReportDraftItem } from "../types/daily-report.types";
import { isNonZeroQuantity } from "./daily-report-quantity";

// Mirrors updateDailyReportSchema so each field can show its own message.
const unsigned = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const signed = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

export type CountField = Exclude<keyof DailyReportDraftItem, "stock_item_id">;

export function countFieldError(
  draft: DailyReportDraftItem,
  field: CountField,
): string | null {
  const value = draft[field];
  switch (field) {
    case "physical_closing_quantity":
      if (value === "") return "Enter the count";
      return unsigned.test(value) ? null : "Use a number like 2 or 1.5";
    case "waste_quantity":
      return unsigned.test(value) ? null : "Use a number like 0 or 1.5";
    case "adjustment_quantity":
      return signed.test(value) ? null : "Use a number like -1 or 0.5";
    case "waste_reason":
      return isNonZeroQuantity(draft.waste_quantity) && !value.trim()
        ? "Add a reason for the waste"
        : null;
    case "adjustment_reason":
      return isNonZeroQuantity(draft.adjustment_quantity) && !value.trim()
        ? "Add a reason for the adjustment"
        : null;
  }
}

/** One message for the whole count set, or null when it can be saved. */
export function countSetError(drafts: DailyReportDraftItem[]) {
  const missing = drafts.filter(
    (draft) => draft.physical_closing_quantity === "",
  ).length;
  if (missing)
    return `Enter a count for ${missing} ${missing === 1 ? "item" : "items"}.`;
  const quantities = [
    "physical_closing_quantity",
    "waste_quantity",
    "adjustment_quantity",
  ] as const;
  if (
    drafts.some((draft) =>
      quantities.some((field) => countFieldError(draft, field)),
    )
  )
    return "Fix the highlighted quantities.";
  if (
    drafts.some(
      (draft) =>
        countFieldError(draft, "waste_reason") ||
        countFieldError(draft, "adjustment_reason"),
    )
  )
    return "Add a reason for each waste or adjustment.";
  return null;
}
