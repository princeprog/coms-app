import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { changeText, changeTone } from "../services/report-format";

/** Change against the comparison period; colour follows good or bad news. */
export function ReportChange({
  value,
  unit,
  risingIsBad,
  pill = false,
}: {
  value: string | null;
  unit?: string;
  risingIsBad?: boolean;
  pill?: boolean;
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
      {changeText(value, unit)}
    </span>
  );
}
