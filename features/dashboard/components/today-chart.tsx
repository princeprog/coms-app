"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { peso } from "@/lib/metric-format";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { weekdayShort } from "../services/dashboard-format";
import { HourlyTrend } from "./hourly-trend";
import { WeekTrend } from "./week-trend";

type View = "hour" | "week";

/** Switches between today's hours and the last seven days. */
export function TodayChart({ data }: { data: DashboardToday }) {
  const [view, setView] = useState<View>("hour");
  const lastWeekLabel = `Last ${weekdayShort(data.business_date)}`;
  const weekTotal = data.last_7_days.reduce(
    (sum, day) => sum + Number(day.net_sales),
    0,
  );
  return (
    <section
      aria-label="Sales trend"
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={view} onValueChange={(value) => setView(value as View)}>
          <TabsList aria-label="Sales trend view" className="h-8">
            <TabsTrigger value="hour" className="px-3 text-xs">
              By hour
            </TabsTrigger>
            <TabsTrigger value="week" className="px-3 text-xs">
              Last 7 days
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {view === "hour" ? (
          <span className="flex shrink-0 items-center gap-3 text-xs whitespace-nowrap text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm bg-[var(--chart-3)]"
              />
              Today
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-3 border-t-2 border-dashed border-muted-foreground"
              />
              {lastWeekLabel}
            </span>
          </span>
        ) : (
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {peso(weekTotal.toFixed(2))} in 7 days
          </span>
        )}
      </div>
      {view === "hour" ? (
        <HourlyTrend hours={data.hourly} lastWeekLabel={lastWeekLabel} />
      ) : (
        <WeekTrend days={data.last_7_days} />
      )}
    </section>
  );
}
