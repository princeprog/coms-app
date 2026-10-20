import { cn } from "@/lib/utils";
import { differenceLabel, differenceTone } from "../services/shift-money";

export function ShiftDifference({ value }: { value: string | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const tone = differenceTone(value);
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        tone === "short" && "text-red-700 dark:text-red-400",
        tone === "over" && "text-amber-700 dark:text-amber-400",
        tone === "balanced" && "text-emerald-700 dark:text-emerald-400",
      )}
    >
      {differenceLabel(value)}
    </span>
  );
}
