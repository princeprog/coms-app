import Link from "next/link";
import { ShiftDifference } from "@/features/shifts/components/shift-difference";
import { ShiftStatusBadge } from "@/features/shifts/components/shift-status-badge";
import { shiftHref } from "@/features/shifts/constants";
import { formatPeso, sumAmounts } from "@/features/shifts/services/shift-money";
import { shiftTime } from "@/features/shifts/services/shift-time";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyReport } from "../types/daily-report.types";

export function DailyReportShifts({
  branchId,
  report,
}: {
  branchId: string;
  report: DailyReport;
}) {
  const shifts = report.shifts ?? [];
  if (!shifts.length) return null;
  // Open shifts have no closing figures yet, so totals cover closed shifts only.
  const closed = shifts.filter((shift) => shift.status !== "OPEN");
  const total = (pick: (shift: (typeof shifts)[number]) => string | null) =>
    sumAmounts(closed.map(pick));
  const cashDifference = total((shift) => shift.cash_difference);
  return (
    <section
      aria-labelledby="report-shifts-heading"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <h3
        id="report-shifts-heading"
        className="border-b px-5 py-3.5 text-sm font-semibold"
      >
        Shifts
      </h3>
      <Table aria-label="Shifts for this business day" className="min-w-2xl">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="pl-5">Shift</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead className="text-right">Cash sales</TableHead>
            <TableHead className="text-right">Non-cash sales</TableHead>
            <TableHead className="text-right">Cash difference</TableHead>
            <TableHead className="pr-5 pl-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell className="py-3 pl-5">
                <Link
                  href={shiftHref(branchId, shift.id)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Shift {shift.shift_number}
                </Link>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {shiftTime(shift.opened_at)}
                  {shift.closed_at
                    ? ` – ${shiftTime(shift.closed_at)}`
                    : " – open"}
                </span>
              </TableCell>
              <TableCell>{shift.cashier_name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPeso(shift.net_cash_sales)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPeso(shift.non_cash_sales)}
              </TableCell>
              <TableCell className="text-right">
                <ShiftDifference value={shift.cash_difference} />
              </TableCell>
              <TableCell className="pr-5 pl-6">
                <ShiftStatusBadge status={shift.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {closed.length > 0 && (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="py-3 pl-5 font-semibold" colSpan={2}>
                {closed.length === shifts.length
                  ? "Day total"
                  : `Total for ${closed.length} closed ${closed.length === 1 ? "shift" : "shifts"}`}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatPeso(total((shift) => shift.net_cash_sales))}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatPeso(total((shift) => shift.non_cash_sales))}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {cashDifference === null ? (
                  "—"
                ) : (
                  <ShiftDifference value={cashDifference} />
                )}
              </TableCell>
              <TableCell className="pr-5 pl-6" />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </section>
  );
}
