import type { ReactNode } from "react";
import type { ShiftDetail } from "../schemas/shift.schema";
import { formatPeso } from "../services/shift-money";
import { ShiftDifference } from "./shift-difference";

function Metric({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{children}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ShiftCountSummary({ shift }: { shift: ShiftDetail }) {
  const open = shift.status === "OPEN";
  const expected = open ? shift.totals.expected_cash : shift.expected_cash;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        label="Opening float"
        hint={
          shift.expected_opening_float === null
            ? "First shift at this branch"
            : `Left by previous shift: ${formatPeso(shift.expected_opening_float)}`
        }
      >
        {formatPeso(shift.opening_float)}
      </Metric>
      <Metric
        label="Expected cash"
        hint={
          open
            ? shift.cash_hidden
              ? "Shown after the count"
              : "So far"
            : undefined
        }
      >
        {shift.cash_hidden ? "Hidden" : formatPeso(expected)}
      </Metric>
      <Metric
        label="Counted cash"
        hint={
          shift.left_in_drawer
            ? `Left in drawer: ${formatPeso(shift.left_in_drawer)}`
            : undefined
        }
      >
        {formatPeso(shift.counted_cash)}
      </Metric>
      <Metric
        label="Cash difference"
        hint={
          shift.opening_difference &&
          !/^-?0(?:\.0+)?$/.test(shift.opening_difference)
            ? `Opening float differed by ${formatPeso(shift.opening_difference)}`
            : undefined
        }
      >
        <ShiftDifference value={shift.cash_difference} />
      </Metric>
    </div>
  );
}
