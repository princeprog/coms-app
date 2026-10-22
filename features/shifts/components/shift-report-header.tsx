import type { ReactNode } from "react";
import { ReceiptText } from "lucide-react";
import type { ShiftReport } from "../schemas/shift.schema";
import { businessDayLong } from "../services/shift-time";
import { ShiftStatusBadge } from "./shift-status-badge";

export function ShiftReportHeader({
  shift,
  back,
  action,
}: {
  shift: ShiftReport;
  back: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-5">
      {back}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
            <ReceiptText aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Shift {shift.shift_number}
              </h1>
              <ShiftStatusBadge status={shift.status} />
            </div>
            <p className="text-sm text-muted-foreground wrap-anywhere">
              {[shift.branch_name, businessDayLong(shift.business_date)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
