import type { DailyReport } from "../types/daily-report.types";

/** Shift numbers that must be closed and reviewed before the report can be submitted. */
export function blockingReportShifts(report: Pick<DailyReport, "shifts">) {
  const shifts = report.shifts ?? [];
  return {
    open: shifts
      .filter((shift) => shift.status === "OPEN")
      .map((s) => s.shift_number),
    unreviewed: shifts
      .filter((shift) => shift.status === "CLOSED")
      .map((s) => s.shift_number),
  };
}
