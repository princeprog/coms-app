import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { CircleCheck, CircleDashed } from "lucide-react";
import { shiftHref } from "@/features/shifts/constants";
import type { DailyReport } from "../types/daily-report.types";
import { getTodayManilaDate } from "../services/manila-date";

type Check = { key: string; done: boolean; label: string; detail?: ReactNode };

function ShiftLinks({
  branchId,
  shifts,
}: {
  branchId: string;
  shifts: NonNullable<DailyReport["shifts"]>;
}) {
  return shifts.map((shift, index) => (
    <Fragment key={shift.id}>
      {index > 0 && ", "}
      <Link
        href={shiftHref(branchId, shift.id)}
        className="font-medium text-foreground underline underline-offset-4"
      >
        Shift {shift.shift_number}
      </Link>
    </Fragment>
  ));
}

/** Mirrors the API's submit rules so staff can see what still blocks submission. */
export function DailyReportChecklist({
  branchId,
  report,
  hasUnsavedChanges,
}: {
  branchId: string;
  report: DailyReport;
  hasUnsavedChanges: boolean;
}) {
  const shifts = report.shifts ?? [];
  const open = shifts.filter((shift) => shift.status === "OPEN");
  const unreviewed = shifts.filter((shift) => shift.status === "CLOSED");
  const counted = report.items.filter(
    (item) => item.physical_closing_quantity !== null,
  ).length;
  const deliveries = report.pending_deliveries?.length ?? 0;
  const dayEnded =
    report.business_day_ended ?? report.business_date < getTodayManilaDate();
  const checks: Check[] = [
    {
      key: "day",
      done: dayEnded,
      label: "Business day has ended",
      detail: "You can submit once the business day is over.",
    },
    {
      key: "open",
      done: open.length === 0,
      label: "All shifts closed",
      detail: (
        <>
          Close <ShiftLinks branchId={branchId} shifts={open} />.
        </>
      ),
    },
    {
      key: "reviewed",
      done: unreviewed.length === 0,
      label: "All shifts reviewed",
      detail: (
        <>
          A manager must review{" "}
          <ShiftLinks branchId={branchId} shifts={unreviewed} />.
        </>
      ),
    },
    {
      key: "counts",
      done: report.items.length > 0 && counted === report.items.length,
      label: "Every item counted",
      detail: `${counted} of ${report.items.length} items counted${hasUnsavedChanges ? " · save your changes" : ""}`,
    },
    {
      key: "deliveries",
      done: deliveries === 0,
      label: "Deliveries counted or explained",
      detail: `${deliveries} ${deliveries === 1 ? "delivery needs" : "deliveries need"} a count, or a reason below when submitting.`,
    },
  ];
  const remaining = checks.filter((check) => !check.done).length;
  return (
    <section
      aria-labelledby="report-checklist-heading"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
        <h3 id="report-checklist-heading" className="text-sm font-semibold">
          Before you submit
        </h3>
        <p className="text-sm text-muted-foreground">
          {remaining ? `${remaining} to do` : "Ready to submit"}
        </p>
      </div>
      <ul className="divide-y">
        {checks.map((check) => {
          const Icon = check.done ? CircleCheck : CircleDashed;
          return (
            <li key={check.key} className="flex items-start gap-3 px-5 py-3">
              <Icon
                aria-hidden="true"
                className={
                  check.done
                    ? "mt-px size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    : "mt-px size-5 shrink-0 text-amber-600 dark:text-amber-400"
                }
              />
              <div className="min-w-0 text-sm">
                <p
                  className={
                    check.done ? "text-muted-foreground" : "font-medium"
                  }
                >
                  <span className="sr-only">
                    {check.done ? "Done: " : "To do: "}
                  </span>
                  {check.label}
                </p>
                {!check.done && check.detail && (
                  <p className="mt-0.5 text-muted-foreground">{check.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
