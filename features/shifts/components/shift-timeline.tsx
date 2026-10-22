import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  LockKeyhole,
  PlayCircle,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftReport } from "../schemas/shift.schema";
import { formatPeso } from "../services/shift-money";
import { shiftDateTime } from "../services/shift-time";
import { ShiftReportCard } from "./shift-report-card";

const tones = {
  neutral: "bg-muted text-foreground ring-foreground/10",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
  bad: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
};

type Entry = {
  key: string;
  at: string;
  icon: LucideIcon;
  tone: keyof typeof tones;
  title: string;
  by: string;
  amount?: ReactNode;
  notes?: { label: string; text: string }[];
};

function entries(shift: ShiftReport): Entry[] {
  const list: Entry[] = [
    {
      key: "opened",
      at: shift.opened_at,
      icon: PlayCircle,
      tone: "neutral",
      title: "Shift opened",
      by: shift.opened_by_name,
      amount: formatPeso(shift.opening_float),
    },
    ...shift.cash_movements.map((move): Entry => ({
      key: move.id,
      at: move.created_at,
      icon: move.direction === "IN" ? ArrowDownLeft : ArrowUpRight,
      tone: move.direction === "IN" ? "good" : "bad",
      title: `Cash ${move.direction === "IN" ? "in" : "out"} · ${move.reason}`,
      by: move.actor_name,
      amount: `${move.direction === "IN" ? "+" : "−"}${formatPeso(move.amount)}`,
    })),
    ...shift.voids.map((entry): Entry => ({
      key: entry.sale_id,
      at: entry.created_at,
      icon: Undo2,
      tone: "bad",
      title: `Voided ${entry.sale_reference}`,
      by: entry.actor_name,
      amount:
        entry.amount === null ? undefined : `−${formatPeso(entry.amount)}`,
      notes: entry.reason ? [{ label: "Reason", text: entry.reason }] : [],
    })),
  ];
  if (shift.closed_at)
    list.push({
      key: "closed",
      at: shift.closed_at,
      icon: LockKeyhole,
      tone: "neutral",
      title: shift.close_type === "FORCED" ? "Force closed" : "Shift closed",
      by: shift.closed_by_name ?? shift.opened_by_name,
      amount: shift.counted_cash ? formatPeso(shift.counted_cash) : undefined,
      notes: [
        shift.force_close_reason && {
          label: "Reason",
          text: shift.force_close_reason,
        },
        shift.cashier_explanation && {
          label: `Explanation from ${shift.opened_by_name}`,
          text: shift.cashier_explanation,
        },
      ].filter((note): note is { label: string; text: string } =>
        Boolean(note),
      ),
    });
  if (shift.reviewed_at)
    list.push({
      key: "reviewed",
      at: shift.reviewed_at,
      icon: BadgeCheck,
      tone: "good",
      title: "Reviewed",
      by: shift.reviewed_by_name ?? "A manager",
      notes: shift.review_note
        ? [{ label: "Review note", text: shift.review_note }]
        : [],
    });
  return list.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** Everything that happened during the shift, oldest first. */
export function ShiftTimeline({ shift }: { shift: ShiftReport }) {
  const list = entries(shift);
  return (
    <ShiftReportCard id="shift-activity-heading" title="Activity">
      <ol className="flex flex-col px-5 pt-1 pb-5 sm:px-6">
        {list.map((entry, index) => {
          const Icon = entry.icon;
          return (
            <li key={entry.key} className="relative flex gap-3 pb-5 last:pb-0">
              {index < list.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-8 bottom-1 left-3.5 w-px bg-border"
                />
              )}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
                  tones[entry.tone],
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium wrap-anywhere">
                    {entry.title}
                  </p>
                  {entry.amount && (
                    <span className="shrink-0 text-sm tabular-nums">
                      {entry.amount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.by} ·{" "}
                  <time dateTime={entry.at}>{shiftDateTime(entry.at)}</time>
                </p>
                {entry.notes?.map((note) => (
                  <div
                    key={note.label}
                    className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                  >
                    <p className="text-xs text-muted-foreground">
                      {note.label}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap wrap-anywhere">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </ShiftReportCard>
  );
}
