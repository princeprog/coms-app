import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { businessDayLabel } from "../services/dashboard-format";
import { reportHref } from "../services/dashboard-links";

const statusBadge = {
  DRAFT: { label: "Draft", className: "bg-slate-600" },
  RETURNED: { label: "Returned", className: "bg-amber-700" },
  MISSING: { label: "Not started", className: "bg-red-700" },
};

/** Unfinished reports from before yesterday, oldest first. */
export function ReportBacklog({ data }: { data: DashboardToday }) {
  const { total, items } = data.report_backlog;
  return (
    <section
      aria-labelledby="dashboard-backlog"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <h2
        id="dashboard-backlog"
        className="flex items-center justify-between gap-2 border-b px-4 py-3 font-semibold"
      >
        Older reports outstanding
        {total > 0 && (
          <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
            {total}
          </span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          No older reports outstanding.
        </p>
      ) : (
        <ul
          aria-label="Older reports outstanding"
          className="flex flex-col p-2"
        >
          {items.map((item) => {
            const badge = statusBadge[item.status];
            return (
              <li key={`${item.branch_id}:${item.business_date}`}>
                <Link
                  href={reportHref(
                    item.branch_id,
                    item.business_date,
                    item.report_id,
                  )}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex min-w-0 flex-1 flex-col text-sm">
                    <span className="truncate font-medium">
                      {item.branch_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {businessDayLabel(item.business_date)} ·{" "}
                      {item.days_outstanding} days ago
                    </span>
                  </span>
                  <Badge className={cn("text-white", badge.className)}>
                    {badge.label}
                  </Badge>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {total > items.length && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Showing the oldest {items.length} of {total}.{" "}
          <Link
            href="/reports"
            className="text-primary underline-offset-4 hover:underline"
          >
            All reports
          </Link>
        </p>
      )}
    </section>
  );
}
