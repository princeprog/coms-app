"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarSync,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectorySelect } from "@/components/shared/directory-select";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { cn } from "@/lib/utils";
import { schedulesRoute, shiftTemplatesRoute } from "../constants";
import { useRefreshSchedules, useScheduleWeek } from "../hooks/use-schedules";
import { addDays, weekLabel, weekStartOf } from "../services/schedule-format";
import { ScheduleWeekGrid } from "./schedule-week-grid";
import { StaffPatternDialog } from "./staff-pattern-dialog";

const press =
  "transition-[scale,background-color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

function ScheduleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading schedule"
      className="flex flex-col gap-2 rounded-xl border p-4"
    >
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function ScheduleWorkspace({
  branches,
  branchId,
  week,
  canManage,
}: {
  branches: { id: string; name: string }[];
  branchId: string;
  /** Monday of the requested week, or empty for the current week. */
  week: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const result = useScheduleWeek(branchId, week);
  const refresh = useRefreshSchedules();
  const [pattern, setPattern] = useState<{ userId?: string } | null>(null);
  const data = result.data;
  const go = (next: { branch?: string; week?: string }) => {
    const params = new URLSearchParams({ branch: next.branch ?? branchId });
    const target = next.week ?? week;
    if (target) params.set("week", target);
    router.push(`${schedulesRoute}?${params}`);
  };
  const current = data ? weekStartOf(data.business_today) : null;
  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who works each shift this week.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${shiftTemplatesRoute}?branch=${branchId}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 gap-2",
                press,
              )}
            >
              <Clock3 aria-hidden="true" className="text-sky-600" />
              Branch shifts
            </Link>
            <Button
              className={cn("min-h-11 gap-2", press)}
              disabled={!data || data.templates.length === 0}
              onClick={() => setPattern({})}
            >
              <CalendarSync aria-hidden="true" data-icon="inline-start" />
              Edit weekly pattern
            </Button>
          </div>
        )}
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {branches.length > 1 && (
          <DirectorySelect
            id="schedule-branch"
            label="Branch"
            hideLabel
            alignItemWithTrigger={false}
            className="sm:w-60 [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3"
            value={branchId}
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
              icon: <Building2 className="text-sky-600" />,
            }))}
            onChange={(value) => go({ branch: value })}
          />
        )}
        <div className="flex items-center gap-1" role="group" aria-label="Week">
          <Button
            variant="outline"
            size="icon"
            className={cn("size-11", press)}
            aria-label="Previous week"
            disabled={!data}
            onClick={() => data && go({ week: addDays(data.week_start, -7) })}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p
            aria-live="polite"
            className="min-w-48 px-2 text-center text-sm font-medium tabular-nums"
          >
            {data ? weekLabel(data.week_start) : "Loading week…"}
          </p>
          <Button
            variant="outline"
            size="icon"
            className={cn("size-11", press)}
            aria-label="Next week"
            disabled={!data}
            onClick={() => data && go({ week: addDays(data.week_start, 7) })}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        {data && current && data.week_start !== current && (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => go({ week: current })}
          >
            This week
          </Button>
        )}
      </div>
      {result.isError && !data ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center"
        >
          <p>{result.error.message}</p>
          <Button variant="outline" onClick={() => result.refetch()}>
            Try again
          </Button>
        </div>
      ) : !data ? (
        <ScheduleSkeleton />
      ) : data.templates.length === 0 ? (
        <OperationalEmptyState
          title="No shifts set up"
          description={`Add ${data.branch.name}'s shifts first, then assign staff to them here.`}
          actions={
            canManage && (
              <Link
                href={`${shiftTemplatesRoute}?branch=${branchId}`}
                className={cn(buttonVariants(), "min-h-11 gap-2", press)}
              >
                <Clock3 aria-hidden="true" />
                Set up shifts
              </Link>
            )
          }
        />
      ) : (
        <div
          aria-busy={result.isFetching}
          className="min-w-0 transition-opacity duration-200 ease-out-quint aria-busy:opacity-60 motion-reduce:transition-none"
        >
          <ScheduleWeekGrid
            week={data}
            canManage={canManage}
            onChanged={() => void refresh()}
            onEditPattern={(userId) => setPattern({ userId })}
          />
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm border border-sky-300 bg-sky-100 dark:bg-sky-400/30"
              />
              Weekly pattern
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm border border-violet-300 bg-violet-100 dark:bg-violet-400/30"
              />
              This day only
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm border border-dashed border-muted-foreground"
              />
              Day off
            </span>
          </p>
        </div>
      )}
      {pattern && data && (
        <StaffPatternDialog
          week={data}
          initialUserId={pattern.userId}
          onClose={() => setPattern(null)}
          onSaved={() => {
            setPattern(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
