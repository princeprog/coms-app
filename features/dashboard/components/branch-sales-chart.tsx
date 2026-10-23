import { MetricChange } from "@/components/shared/metric-change";
import { peso } from "@/lib/metric-format";
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { weekdayShort } from "../services/dashboard-format";

/**
 * Each branch's net sales so far today as a bar, with a marker at the same
 * time on the same weekday last week.
 */
export function BranchSalesChart({ data }: { data: DashboardToday }) {
  const lastWeek = `Last ${weekdayShort(data.business_date)}`;
  const branches = [...data.branches].sort(
    (a, b) => Number(b.net_sales) - Number(a.net_sales),
  );
  const top = Math.max(
    ...branches.flatMap((branch) => [
      Number(branch.net_sales),
      Number(branch.last_week_net_sales),
    ]),
    0,
  );
  const share = (value: string) => (top ? Number(value) / top : 0);
  return (
    <section
      aria-labelledby="dashboard-branch-sales"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 id="dashboard-branch-sales" className="font-semibold">
          Branch sales vs last week
        </h2>
        <span
          aria-hidden="true"
          className="flex items-center gap-3 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--chart-3)]" />
            Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 rounded-full bg-foreground/70" />
            {lastWeek} at this time
          </span>
        </span>
      </div>
      {top === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          No sales yet today or at this time last week.
        </p>
      ) : (
        <ul
          aria-label="Branch sales vs last week"
          className="flex flex-col gap-4 p-4"
        >
          {branches.map((branch) => (
            <li key={branch.branch_id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">
                  {branch.branch_name}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {peso(branch.net_sales)}
                  </span>
                  <MetricChange
                    value={branch.net_sales_change}
                    pill
                    empty="No sales last week"
                  />
                </span>
              </div>
              <div aria-hidden="true" className="relative h-2.5">
                <div className="absolute inset-0 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full w-full origin-left rounded-full bg-[var(--chart-3)] transition-transform duration-300 ease-out-quint motion-reduce:transition-none"
                    style={{
                      transform: `scaleX(${share(branch.net_sales)})`,
                    }}
                  />
                </div>
                {Number(branch.last_week_net_sales) > 0 && (
                  <div
                    className="absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
                    style={{
                      left: `${share(branch.last_week_net_sales) * 100}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {lastWeek} at this time: {peso(branch.last_week_net_sales)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
