import { CircleCheck, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftDetail } from "../schemas/shift.schema";
import {
  differenceLabel,
  differenceTone,
  formatPeso,
} from "../services/shift-money";

const tones = {
  balanced: {
    icon: CircleCheck,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  over: {
    icon: TrendingUp,
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  short: {
    icon: TrendingDown,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  },
};

export function ShiftCountResult({ shift }: { shift: ShiftDetail }) {
  const tone = differenceTone(shift.cash_difference);
  const { icon: Icon, className } = tones[tone];
  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-xl border p-4",
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-6 shrink-0" />
        <div>
          <p className="text-lg font-semibold tabular-nums">
            {differenceLabel(shift.cash_difference)}
          </p>
          <p className="text-sm opacity-80">
            Shift {shift.shift_number} closed
          </p>
        </div>
      </div>
      <dl className="divide-y rounded-xl border text-sm">
        {[
          ["Expected cash", shift.expected_cash],
          ["Counted cash", shift.counted_cash],
          ["Left in drawer", shift.left_in_drawer],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{formatPeso(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
