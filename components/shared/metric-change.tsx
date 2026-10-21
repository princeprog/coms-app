import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { changeText, changeTone } from "@/lib/metric-format";

/** Change against a comparison period; colour follows good or bad news. */
export function MetricChange({
  value,
  unit,
  risingIsBad,
  pill = false,
  empty,
}: {
  value: string | null;
  unit?: string;
  risingIsBad?: boolean;
  pill?: boolean;
  /** Text when there is nothing to compare against. */
  empty?: string;
}) {
  const tone = changeTone(value, risingIsBad);
  const number = Number(value);
  const Icon =
    value === null || number === 0
      ? Minus
      : number > 0
        ? ArrowUpRight
        : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        pill && "rounded-full px-2 py-0.5",
        tone === "good" && "text-emerald-700 dark:text-emerald-400",
        tone === "bad" && "text-red-700 dark:text-red-400",
        tone === "neutral" && "text-muted-foreground",
        pill && tone === "good" && "bg-emerald-50 dark:bg-emerald-500/10",
        pill && tone === "bad" && "bg-red-50 dark:bg-red-500/10",
        pill && tone === "neutral" && "bg-muted",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {changeText(value, unit, empty)}
    </span>
  );
}
