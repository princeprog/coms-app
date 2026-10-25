"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMySchedule } from "../hooks/use-schedules";
import { addDays, shortDate, timeRange } from "../services/schedule-format";

export function MyScheduleView() {
  const schedule = useMySchedule();
  const data = schedule.data;
  return (
    <div data-coms-ui="operational" className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your shifts for the next two weeks.
        </p>
      </header>
      {schedule.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center"
        >
          <p>Your schedule could not be loaded.</p>
          <Button variant="outline" onClick={() => schedule.refetch()}>
            Try again
          </Button>
        </div>
      ) : !data ? (
        <div
          role="status"
          aria-label="Loading your schedule"
          className="flex flex-col gap-2"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: data.days }, (_, index) => {
            const date = addDays(data.business_today, index);
            const shifts = data.shifts.filter(
              (shift) => shift.work_date === date,
            );
            const today = index === 0;
            return (
              <li
                key={date}
                aria-current={today ? "date" : undefined}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-6",
                  today && "bg-primary/[0.04]",
                )}
              >
                <p className="w-36 shrink-0 text-sm font-medium">
                  {shortDate(date)}
                  {today && (
                    <span className="ml-2 rounded-full bg-primary px-1.5 py-px text-xs text-primary-foreground">
                      Today
                    </span>
                  )}
                </p>
                {shifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Off</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {shifts.map((shift) => (
                      <li
                        key={`${shift.branch_id}-${shift.template_id}`}
                        className="text-sm"
                      >
                        <span className="font-medium">
                          {shift.template_name}
                        </span>{" "}
                        <span className="tabular-nums text-muted-foreground">
                          {timeRange(shift.start_time, shift.end_time)}
                        </span>
                        {shift.source === "EXTRA" && (
                          <span className="ml-2 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-px text-xs text-violet-950 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100">
                            Extra
                          </span>
                        )}
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2
                            aria-hidden="true"
                            className="size-3.5 text-sky-600"
                          />
                          {shift.branch_name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
