import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyReport } from "@/features/daily-reports/types/daily-report.types";
import { formatPeso } from "@/features/shifts/services/shift-money";

export function DailyReportSalesSummary({ report }: { report: DailyReport }) {
  const values = [
    {
      label: "Completed sales",
      amount: report.completed_sales_amount,
      count: report.completed_sales_count,
    },
    {
      label: "Voided sales",
      amount: report.voided_sales_amount,
      count: report.voided_sales_count,
    },
  ];

  return (
    <section aria-label="Sales summary" className="grid gap-3 sm:grid-cols-2">
      {values.map((value) => (
        <Card key={value.label}>
          <CardHeader className="pb-2">
            <CardDescription>{value.label}</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatPeso(value.amount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {value.count} {value.count === 1 ? "sale" : "sales"}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
