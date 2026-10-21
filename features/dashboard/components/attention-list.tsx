import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileClock,
  FileWarning,
  FilePen,
  PackageMinus,
  Truck,
  Undo2,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  AttentionKey,
  DashboardToday,
} from "../schemas/dashboard-today.schema";
import {
  attentionHref,
  pendingAttention,
  type AttentionTone,
} from "../services/attention";

const icons: Record<AttentionKey, ReactNode> = {
  deliveries_overdue: <Truck />,
  open_discrepancies: <AlertTriangle />,
  shifts_open_past_day: <Clock />,
  cash_shortages: <Banknote />,
  stock_below_zero: <PackageMinus />,
  reports_missing: <FileWarning />,
  reports_returned: <Undo2 />,
  reports_to_review: <FileClock />,
  late_counts_to_review: <ClipboardCheck />,
  shifts_to_review: <UserCheck />,
  dispatches_draft: <FilePen />,
  deliveries_in_transit: <Truck />,
  products_incomplete_costs: <UtensilsCrossed />,
};

const toneStyles: Record<AttentionTone, string> = {
  critical: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
};
const countStyles: Record<AttentionTone, string> = {
  critical: "bg-red-600 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-sky-600 text-white",
};

/** Problems to deal with, most urgent first; each opens its page. */
export function AttentionList({
  data,
  branchId,
}: {
  data: DashboardToday;
  branchId?: string;
}) {
  const items = pendingAttention(data.attention);
  return (
    <section
      aria-labelledby="dashboard-attention"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <h2 id="dashboard-attention" className="border-b px-4 py-3 font-semibold">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <CheckCircle2
            aria-hidden="true"
            className="size-8 text-emerald-600"
          />
          <p className="font-medium">All clear</p>
          <p className="text-sm text-muted-foreground">
            Nothing needs your attention right now.
          </p>
        </div>
      ) : (
        <ul aria-label="Needs attention" className="flex flex-col p-2">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={attentionHref(item.key, branchId)}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                    toneStyles[item.tone],
                  )}
                >
                  {icons[item.key]}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  {item.label(item.count)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    countStyles[item.tone],
                  )}
                >
                  {item.count}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
