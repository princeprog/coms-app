import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatQuantity,
  varianceTone,
} from "../services/daily-report-quantity";

/** Saved variance; dimmed with a hint when the row has unsaved edits. */
export function DailyReportVariance({
  value,
  unit,
  stale = false,
}: {
  value: string | null;
  unit: string;
  stale?: boolean;
}) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const tone = varianceTone(value);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium tabular-nums",
          tone === "match" && "text-emerald-700 dark:text-emerald-400",
          tone === "short" && "text-red-700 dark:text-red-400",
          tone === "over" && "text-amber-700 dark:text-amber-400",
          stale && "opacity-50",
        )}
      >
        {tone === "match" ? (
          <>
            <Check aria-hidden="true" className="size-3.5" />
            Matches
          </>
        ) : (
          <>
            {tone === "over" ? "+" : ""}
            {formatQuantity(value)} {unit}
            <span className="sr-only">
              {tone === "short" ? " short" : " over"}
            </span>
          </>
        )}
      </span>
      {stale && (
        <span className="text-xs text-muted-foreground">Save to update</span>
      )}
    </span>
  );
}
