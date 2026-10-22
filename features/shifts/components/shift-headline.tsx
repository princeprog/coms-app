import type { ReactNode } from "react";
import { CircleCheck, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftReport } from "../schemas/shift.schema";
import {
  differenceLabel,
  differenceTone,
  formatPeso,
} from "../services/shift-money";
import { plural } from "./shift-report-card";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}

const tones = {
  balanced: {
    icon: CircleCheck,
    className: "text-emerald-700 dark:text-emerald-400",
  },
  over: { icon: TrendingUp, className: "text-amber-700 dark:text-amber-400" },
  short: { icon: TrendingDown, className: "text-red-700 dark:text-red-400" },
};

function CashResult({ shift }: { shift: ShiftReport }) {
  if (shift.status === "OPEN")
    return (
      <Stat
        label="Cash count"
        value={<span className="text-muted-foreground">Not counted</span>}
        hint={
          shift.cash_hidden
            ? "Counted when the shift ends"
            : `Expected so far ${formatPeso(shift.totals.expected_cash)}`
        }
      />
    );
  const tone = differenceTone(shift.cash_difference);
  const { icon: Icon, className } = tones[tone];
  return (
    <Stat
      label="Cash count"
      value={
        <span className={cn("inline-flex items-center gap-2", className)}>
          <Icon aria-hidden="true" className="size-5 shrink-0" />
          {differenceLabel(shift.cash_difference)}
        </span>
      }
      hint={`Counted ${formatPeso(shift.counted_cash)} of ${formatPeso(shift.expected_cash)} expected`}
    />
  );
}

/** Headline figures a manager checks first. */
export function ShiftHeadline({ shift }: { shift: ShiftReport }) {
  const sales = shift.sales_summary;
  const open = shift.status === "OPEN";
  const salesHint = sales
    ? [
        `${sales.items_sold} ${sales.items_sold === "1" ? "item" : "items"} sold`,
        sales.voided_count ? `${sales.voided_count} voided` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  return (
    <dl
      aria-label="Shift summary"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-foreground/10 shadow-xs ring-1 ring-foreground/10 sm:grid-cols-2 xl:grid-cols-4"
    >
      <Stat
        label={open ? "Net sales so far" : "Net sales"}
        value={sales ? formatPeso(sales.net_amount) : "—"}
        hint={
          !sales
            ? "Shown after you count the drawer"
            : sales.voided_count
              ? `Gross ${formatPeso(sales.gross_amount)}`
              : undefined
        }
      />
      <Stat
        label={sales ? "Completed sales" : "Sales"}
        value={sales ? sales.completed_count : shift.sales_count}
        hint={salesHint}
      />
      <Stat
        label="Average sale"
        value={sales?.average_amount ? formatPeso(sales.average_amount) : "—"}
        hint={
          sales?.completed_count
            ? `Across ${plural(sales.completed_count, "sale")}`
            : undefined
        }
      />
      <CashResult shift={shift} />
    </dl>
  );
}
