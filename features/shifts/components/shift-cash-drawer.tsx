import type { ReactNode } from "react";
import type { ShiftReport } from "../schemas/shift.schema";
import {
  differenceLabel,
  formatPeso,
  isZeroAmount,
  subtractAmounts,
} from "../services/shift-money";
import { ShiftDifference } from "./shift-difference";
import {
  plural,
  ShiftReportCard,
  ShiftReportLine,
  SignedAmount,
} from "./shift-report-card";

const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-sm font-normal text-muted-foreground">{children}</span>
);

function openingHint(shift: ShiftReport) {
  if (shift.expected_opening_float === null)
    return "First shift at this branch";
  const left = `Previous shift left ${formatPeso(shift.expected_opening_float)}`;
  return isZeroAmount(shift.opening_difference)
    ? left
    : `${left} · ${differenceLabel(shift.opening_difference)}`;
}

/** Statement from opening float to the counted drawer. */
export function ShiftCashDrawer({ shift }: { shift: ShiftReport }) {
  const open = shift.status === "OPEN";
  const hidden = shift.cash_hidden;
  const totals = shift.totals;
  const removed =
    shift.counted_cash !== null && shift.left_in_drawer !== null
      ? subtractAmounts(shift.counted_cash, shift.left_in_drawer)
      : null;
  return (
    <ShiftReportCard
      id="shift-cash-heading"
      title="Cash drawer"
      aside={open && <Muted>So far</Muted>}
    >
      <dl className="pb-2 text-sm">
        <ShiftReportLine
          label="Opening float"
          hint={openingHint(shift)}
          value={formatPeso(shift.opening_float)}
        />
        {!hidden && (
          <ShiftReportLine
            label="Cash sales"
            value={<SignedAmount sign="+" value={totals.cash_sales_amount} />}
          />
        )}
        {!hidden && (
          <ShiftReportLine
            label="Cash refunds"
            hint={
              totals.voids_count
                ? plural(totals.voids_count, "void")
                : undefined
            }
            value={<SignedAmount sign="−" value={totals.cash_refunds_amount} />}
          />
        )}
        <ShiftReportLine
          label="Cash in"
          value={<SignedAmount sign="+" value={totals.cash_in_amount} />}
        />
        <ShiftReportLine
          label="Cash out"
          value={<SignedAmount sign="−" value={totals.cash_out_amount} />}
        />
      </dl>
      <dl className="border-t bg-muted/40 py-2 text-sm">
        <ShiftReportLine
          strong
          label="Expected in drawer"
          value={
            hidden ? (
              <Muted>After you count</Muted>
            ) : (
              formatPeso(open ? totals.expected_cash : shift.expected_cash)
            )
          }
        />
        <ShiftReportLine
          label="Counted"
          value={
            shift.counted_cash === null ? (
              <Muted>Not counted yet</Muted>
            ) : (
              formatPeso(shift.counted_cash)
            )
          }
        />
        {!open && (
          <ShiftReportLine
            strong
            label="Difference"
            value={<ShiftDifference value={shift.cash_difference} />}
          />
        )}
      </dl>
      {removed !== null && (
        <dl className="border-t py-2 text-sm">
          <ShiftReportLine
            label="Left for next shift"
            value={formatPeso(shift.left_in_drawer)}
          />
          <ShiftReportLine
            label="Removed from drawer"
            value={formatPeso(removed)}
          />
        </dl>
      )}
    </ShiftReportCard>
  );
}
