"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ScheduleWeek } from "../schemas/schedule.schema";
import {
  WEEKDAYS,
  lengthLabel,
  monthDay,
  timeRange,
} from "../services/schedule-format";
import { buildScheduleCells, cellKey } from "../services/schedule-grid";
import { ScheduleCell } from "./schedule-cell";

export function ScheduleWeekGrid({
  week,
  canManage,
  onChanged,
  onEditPattern,
}: {
  week: ScheduleWeek;
  canManage: boolean;
  onChanged: () => void;
  onEditPattern: (userId: string) => void;
}) {
  const cells = useMemo(() => buildScheduleCells(week), [week]);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Positioned so screen-reader-only labels stay inside the scroll box. */}
      <div className="relative w-full overflow-x-auto">
        <table className="w-full min-w-5xl table-fixed border-collapse text-sm">
          <caption className="sr-only">
            {week.branch.name} schedule for the week of{" "}
            {monthDay(week.week_start)}
          </caption>
          <colgroup>
            <col className="w-44" />
            {week.days.map((day) => (
              <col key={day.date} />
            ))}
          </colgroup>
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Shift
              </th>
              {week.days.map((day) => {
                const today = day.date === week.business_today;
                return (
                  <th
                    key={day.date}
                    scope="col"
                    aria-current={today ? "date" : undefined}
                    className={cn(
                      "border-l px-3 py-3 text-left font-medium",
                      day.is_past && "text-muted-foreground",
                    )}
                  >
                    <span className="block">
                      {WEEKDAYS[day.weekday - 1]?.short}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-normal",
                        today
                          ? "inline-flex rounded-full bg-primary px-1.5 py-px font-medium text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {monthDay(day.date)}
                      {today && <span className="sr-only">, today</span>}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {week.templates.map((template) => (
              <tr key={template.id} className="border-t align-top">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="block font-medium">{template.name}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {timeRange(template.start_time, template.end_time)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {lengthLabel(template.start_time, template.end_time)}
                  </span>
                </th>
                {week.days.map((day) => {
                  const cell = cells.get(cellKey(template.id, day.date))!;
                  return (
                    <td
                      key={day.date}
                      className={cn(
                        "border-l px-2 py-2.5",
                        !cell.runs && cell.people.length === 0 && "bg-muted/30",
                        day.date === week.business_today && "bg-primary/[0.03]",
                      )}
                    >
                      <ScheduleCell
                        branchId={week.branch.id}
                        shift={template}
                        date={day.date}
                        cell={cell}
                        editable={canManage && !day.is_past}
                        onChanged={onChanged}
                        onEditPattern={onEditPattern}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
