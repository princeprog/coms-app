import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import styles from "./daily-report-counts.module.css";

export type CountFilter = "all" | "todo" | "variance";

export function DailyReportCountToolbar({
  filter,
  counts,
  editable,
  counted,
  total,
  onFilter,
}: {
  filter: CountFilter;
  counts: Record<CountFilter, number>;
  editable: boolean;
  counted: number;
  total: number;
  onFilter: (filter: CountFilter) => void;
}) {
  const options: { key: CountFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...(editable ? [{ key: "todo" as const, label: "To count" }] : []),
    { key: "variance", label: "Variance" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
      <div
        role="group"
        aria-label="Show items"
        className="inline-flex rounded-lg bg-muted p-0.5"
      >
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={filter === option.key}
            onClick={() => onFilter(option.key)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              filter === option.key && "bg-card text-foreground shadow-xs",
            )}
          >
            {option.label}
            <span className="text-xs text-muted-foreground tabular-nums">
              {counts[option.key]}
            </span>
          </button>
        ))}
      </div>
      {editable && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div
            aria-hidden="true"
            className="h-1.5 w-28 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                styles.progress,
                "h-full rounded-full bg-emerald-600",
              )}
              style={
                { "--share": total ? counted / total : 0 } as CSSProperties
              }
            />
          </div>
          <p aria-live="polite">
            <span className="font-medium text-foreground tabular-nums">
              {counted}
            </span>{" "}
            of {total} counted
          </p>
        </div>
      )}
    </div>
  );
}
