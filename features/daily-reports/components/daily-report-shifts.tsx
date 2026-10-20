import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { ShiftDifference } from "@/features/shifts/components/shift-difference";
import { ShiftStatusBadge } from "@/features/shifts/components/shift-status-badge";
import { shiftHref } from "@/features/shifts/constants";
import { formatPeso } from "@/features/shifts/services/shift-money";
import { shiftTime } from "@/features/shifts/services/shift-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DailyReport } from "../types/daily-report.types";
import { blockingReportShifts } from "../services/report-shift-blocks";

export function DailyReportShifts({
  branchId,
  report,
}: {
  branchId: string;
  report: DailyReport;
}) {
  const shifts = report.shifts ?? [];
  if (!shifts.length) return null;
  const blocking = blockingReportShifts(report);
  const editable = report.status === "DRAFT" || report.status === "RETURNED";
  const message = blocking.open.length
    ? `Close shift ${blocking.open.join(", ")} before submitting this report.`
    : blocking.unreviewed.length
      ? `A manager must review shift ${blocking.unreviewed.join(", ")} before this report can be submitted.`
      : null;
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
      {editable && message && (
        <p
          role="status"
          className="flex items-center gap-2 border-b bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {message}
        </p>
      )}
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
      </Table>
    </section>
  );
}
