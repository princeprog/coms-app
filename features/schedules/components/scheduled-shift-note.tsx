"use client";

import { CalendarCheck2, CalendarX2 } from "lucide-react";
import { useMySchedule } from "../hooks/use-schedules";
import { clockLabel, timeRange } from "../services/schedule-format";

const EARLY_MS = 30 * 60_000;

/** Tells the person starting a register shift whether they're on the schedule. */
export function ScheduledShiftNote({ branchId }: { branchId: string }) {
  const schedule = useMySchedule();
  const data = schedule.data;
  if (!data || data.shifts.length === 0) return null;
  // The fetch time stands in for "now"; the query refreshes every minute.
  const now = schedule.dataUpdatedAt;
  const here = data.shifts.filter((shift) => shift.branch_id === branchId);
  const current = here.find(
    (shift) =>
      Date.parse(shift.starts_at) - EARLY_MS <= now &&
      now < Date.parse(shift.ends_at),
  );
  const next = here.find(
    (shift) =>
      shift.work_date === data.business_today &&
      Date.parse(shift.starts_at) > now,
  );
  if (current)
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"
      >
        <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          You&apos;re scheduled for{" "}
          <span className="font-medium">{current.template_name}</span>,{" "}
          {timeRange(current.start_time, current.end_time)}.
        </span>
      </p>
    );
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground"
    >
      <CalendarX2
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-600"
      />
      <span>
        {next
          ? `Your next shift here is ${next.template_name} at ${clockLabel(next.start_time)}. You can still start now; managers will see it was outside your schedule.`
          : "You're not on the schedule here right now. You can still start; managers will see it was outside your schedule."}
      </span>
    </p>
  );
}
