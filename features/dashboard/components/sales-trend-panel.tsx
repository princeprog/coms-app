import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { salesReportHref } from "../services/dashboard-links";
import { TodayChart } from "./today-chart";

/** Today's sales by hour, or the last seven days, beside the attention list. */
export function SalesTrendPanel({
  data,
  canOpenReport,
  branchId,
}: {
  data: DashboardToday;
  canOpenReport: boolean;
  branchId?: string;
}) {
  return (
    <section
      aria-labelledby="dashboard-sales-trend"
      className="flex h-full min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="dashboard-sales-trend" className="font-semibold">
          Sales trend
        </h2>
        {canOpenReport && (
          <Link
            href={salesReportHref(branchId)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sales report
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
      <TodayChart data={data} />
    </section>
  );
}
