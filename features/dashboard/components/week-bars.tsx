import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { businessDayLabel } from "../services/dashboard-format";
import { risingLastWeek } from "../services/exception-trend";

/**
 * Four tiny weekly bars, oldest first. Screen readers get the weekly values
 * as text instead of the bars.
 */
export function WeekBars({
  values,
  weekStarts,
  label,
}: {
  values: number[];
  weekStarts: string[];
  label: string;
}) {
  const top = Math.max(...values, 0);
  const rising = risingLastWeek(values);
  return (
    <span className="inline-flex items-end gap-2">
      <span aria-hidden="true" className="flex h-5 items-end gap-0.5">
        {values.map((value, index) => (
          <span
            key={weekStarts[index] ?? index}
            className={cn(
              "w-1.5 rounded-sm",
              value === 0
                ? "h-0.5 bg-muted-foreground/30"
                : index === values.length - 1
                  ? "bg-amber-600"
                  : "bg-slate-400 dark:bg-slate-500",
            )}
            style={
              value === 0
                ? undefined
                : { height: `${Math.max(20, (value / top) * 100)}%` }
            }
          />
        ))}
      </span>
      <span className="sr-only">
        {label} by week:{" "}
        {values
          .map(
            (value, index) =>
              `week of ${businessDayLabel(weekStarts[index])} ${value}`,
          )
          .join(", ")}
      </span>
      {rising && (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <TrendingUp aria-hidden="true" className="size-3.5" />
          Up
        </span>
      )}
    </span>
  );
}
