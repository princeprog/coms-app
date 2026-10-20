import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { ShiftDetail } from "../schemas/shift.schema";
import { formatPeso } from "../services/shift-money";
import { shiftTime } from "../services/shift-time";

function duration(from: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(from).getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function EndShiftSummary({ shift }: { shift: ShiftDetail }) {
  const tiles = [
    ["Opened", shiftTime(shift.opened_at), duration(shift.opened_at)],
    [
      "Sales recorded",
      String(shift.totals.sales_count),
      `${shift.totals.voids_count} voided`,
    ],
    [
      "Cash in / out",
      `+${formatPeso(shift.totals.cash_in_amount)}`,
      `−${formatPeso(shift.totals.cash_out_amount)}`,
    ],
  ];
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <dt className="text-xs font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            <dd className="text-xs text-muted-foreground tabular-nums">
              {sub}
            </dd>
          </div>
        ))}
      </dl>
      {shift.cash_movements.length > 0 && (
        <ul
          aria-label="Cash in and out"
          className="divide-y rounded-xl border bg-card text-sm"
        >
          {shift.cash_movements.map((move) => (
            <li
              key={move.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                {move.direction === "OUT" ? (
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-red-600"
                  />
                ) : (
                  <ArrowDownLeft
                    aria-hidden="true"
                    className="size-4 shrink-0 text-emerald-600"
                  />
                )}
                <span className="truncate">{move.reason}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {shiftTime(move.created_at)}
                </span>
              </span>
              <span className="tabular-nums">
                {move.direction === "OUT" ? "−" : "+"}
                {formatPeso(move.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
