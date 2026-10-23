import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { count, peso } from "@/lib/metric-format";
import type {
  DashboardExceptions,
  ExceptionWeek,
} from "../schemas/dashboard-exceptions.schema";
import { sumMoney, sumValues } from "../services/exception-trend";
import { WeekBars } from "./week-bars";

type Metric = {
  key: string;
  label: string;
  visible: (access: DashboardExceptions["access"]) => boolean;
  values: (week: ExceptionWeek) => number;
  detail?: (
    weeks: ExceptionWeek[],
    access: DashboardExceptions["access"],
  ) => string | null;
};

const metrics: Metric[] = [
  {
    key: "shortages",
    label: "Count shortages",
    visible: (access) => access.shortages,
    values: (week) => week.shortage_lines ?? 0,
    detail: (weeks, access) =>
      access.shortage_values
        ? `${peso(sumMoney(weeks.map((week) => week.shortage_value ?? "0")))} short`
        : null,
  },
  {
    key: "cash",
    label: "Cash short shifts",
    visible: (access) => access.cash,
    values: (week) => week.cash_short_shifts ?? 0,
    detail: (weeks) =>
      `${peso(sumMoney(weeks.map((week) => week.cash_short_amount ?? "0")))} short`,
  },
  {
    key: "receiving",
    label: "Receiving differences",
    visible: (access) => access.receiving,
    values: (week) => week.receiving_differences ?? 0,
  },
  {
    key: "voids",
    label: "Voids",
    visible: () => true,
    values: (week) => week.void_count,
    detail: (weeks) => peso(sumMoney(weeks.map((week) => week.void_amount))),
  },
];

/** Each branch's exceptions per week, with four-week totals. */
export function BranchExceptionsTable({ data }: { data: DashboardExceptions }) {
  const shown = metrics.filter((metric) => metric.visible(data.access));
  if (data.branches.length === 0)
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No branches to show in this view.
      </p>
    );
  return (
    <Table
      containerProps={{
        role: "region",
        "aria-label": "Exceptions by branch table",
        tabIndex: 0,
      }}
    >
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead scope="col" className="pl-4">
            Branch
          </TableHead>
          {shown.map((metric) => (
            <TableHead key={metric.key} scope="col">
              {metric.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.branches.map((branch) => (
          <TableRow key={branch.branch_id}>
            <TableCell className="pl-4 font-medium whitespace-normal">
              {branch.branch_name}
            </TableCell>
            {shown.map((metric) => {
              const values = branch.weeks.map(metric.values);
              const total = sumValues(values);
              const detail =
                total > 0 ? metric.detail?.(branch.weeks, data.access) : null;
              return (
                <TableCell key={metric.key} className="align-top">
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-3">
                      <span className="min-w-6 font-medium tabular-nums">
                        {count(total)}
                      </span>
                      <WeekBars
                        values={values}
                        weekStarts={data.week_starts}
                        label={metric.label}
                      />
                    </span>
                    {detail && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {detail}
                      </span>
                    )}
                  </span>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
