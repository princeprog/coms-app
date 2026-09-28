import {
  AlertTriangleIcon,
  ArrowDownToLineIcon,
  BadgeCheckIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  ShoppingBagIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";

export function DashboardSummaryCards({ data }: { data: DashboardData }) {
  const summary = data.summary;
  const metrics = [
    {
      label: "Completed sales",
      value: formatAmount(summary.completed_sales_amount),
      detail: `${summary.completed_sales_count} completed transactions`,
      Icon: CircleDollarSignIcon,
      href: undefined,
    },
    {
      label: "Voided sales",
      value: formatAmount(summary.voided_sales_amount),
      detail: `${summary.voided_sales_count} voided transactions`,
      Icon: XCircleIcon,
      href: undefined,
    },
    {
      label: "Units sold",
      value: summary.units_sold,
      detail: "Ledger-recorded stock usage",
      Icon: ShoppingBagIcon,
      href: undefined,
    },
    {
      label: "Reports submitted",
      value: String(summary.submitted_reports_count),
      detail: "Submitted branch close reports",
      Icon: ClipboardCheckIcon,
      href: undefined,
    },
    {
      label: "Reports approved",
      value: String(summary.approved_reports_count),
      detail: "Approved branch close reports",
      Icon: BadgeCheckIcon,
      href: undefined,
    },
    {
      label: "Open discrepancies",
      value: String(summary.open_discrepancies_count),
      detail: "Dispatches awaiting reconciliation",
      Icon: AlertTriangleIcon,
      href:
        summary.open_discrepancies_count > 0
          ? "/dispatches?discrepancy_status=OPEN"
          : undefined,
    },
    {
      label: "In transit",
      value: String(summary.in_transit_dispatches_count),
      detail: "Dispatches with stock still outstanding",
      Icon: ArrowDownToLineIcon,
      href: undefined,
    },
  ];

  return (
    <section
      aria-label="Operational summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map(({ label, value, detail, Icon, href }) => (
        <Card key={label}>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div className="grid gap-1">
              <CardDescription>
                {href ? (
                  <Link
                    href={href}
                    className="underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </div>
            <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function formatAmount(value: string) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(
    Number(value),
  );
}
import Link from "next/link";
