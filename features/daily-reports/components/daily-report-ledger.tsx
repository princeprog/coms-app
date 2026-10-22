import type { DailyReportItem } from "../types/daily-report.types";
import {
  formatQuantity,
  isNonZeroQuantity,
} from "../services/daily-report-quantity";

type Step = { label: string; value: string; sign: "" | "+" | "−" | "=" | "±" };

function signed(value: string) {
  return value.startsWith("-") ? "−" : "+";
}

/** API figures from opening stock to the expected count; nothing is recalculated here. */
export function DailyReportLedger({ item }: { item: DailyReportItem }) {
  const steps: Step[] = [
    { label: "Opening", value: item.opening_quantity, sign: "" },
    { label: "Received", value: item.receipt_quantity, sign: "+" },
    {
      label: "Used by sales",
      value: item.sale_consumption_quantity,
      sign: "−",
    },
  ];
  if (isNonZeroQuantity(item.sale_void_reversal_quantity))
    steps.push({
      label: "Voided sales returned",
      value: item.sale_void_reversal_quantity,
      sign: "+",
    });
  if (isNonZeroQuantity(item.ledger_adjustment_quantity))
    steps.push({
      label: "Inventory adjustments",
      value: item.ledger_adjustment_quantity,
      sign: signed(item.ledger_adjustment_quantity),
    });
  steps.push({
    label: "In the system",
    value: item.ledger_closing_quantity,
    sign: "=",
  });
  if (isNonZeroQuantity(item.waste_quantity))
    steps.push({ label: "Waste", value: item.waste_quantity, sign: "−" });
  if (isNonZeroQuantity(item.adjustment_quantity))
    steps.push({
      label: "Count adjustment",
      value: item.adjustment_quantity,
      sign: signed(item.adjustment_quantity),
    });
  steps.push({
    label: "Expected",
    value: item.expected_closing_quantity,
    sign: "=",
  });
  return (
    <dl
      aria-label={`Stock movements for ${item.stock_item_name}`}
      className="flex flex-wrap items-end gap-x-5 gap-y-3 text-sm"
    >
      {steps.map((step) => (
        <div key={step.label} className="flex items-end gap-2">
          {step.sign && (
            <span aria-hidden="true" className="pb-px text-muted-foreground">
              {step.sign}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{step.label}</dt>
            <dd
              className={
                step.sign === "="
                  ? "font-semibold tabular-nums"
                  : "tabular-nums"
              }
            >
              {formatQuantity(step.value.replace("-", ""))} {item.unit}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
