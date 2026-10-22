import { cn } from "@/lib/utils";
import type { DailyReportDirectory } from "../types/daily-report.types";
import type { DailyReportPageFilters } from "../services/daily-report-page-params";

type Status = DailyReportPageFilters["status"];

// Reports waiting on someone come first.
const tabs: { value: Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "RETURNED", label: "Returned" },
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
];

export function DailyReportStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: Status;
  counts: DailyReportDirectory["status_counts"];
  onChange: (status: Status) => void;
}) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return (
    <div
      role="group"
      aria-label="Report status"
      className="flex w-full overflow-x-auto rounded-lg bg-muted p-1 sm:w-fit"
    >
      {tabs.map((tab) => {
        const count = tab.value === "all" ? total : counts[tab.value];
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-card text-foreground shadow-xs",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 text-xs tabular-nums",
                active ? "bg-muted text-foreground" : "text-muted-foreground",
                tab.value === "SUBMITTED" &&
                  count > 0 &&
                  "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
