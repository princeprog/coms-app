import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailyReport } from "@/features/daily-reports/types/daily-report.types";

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
            <CardDescription>{value.label} · amount</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {formatAmount(value.amount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {value.count} {value.count === 1 ? "transaction" : "transactions"}
            </p>
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Amounts are recorded without a currency symbol. This snapshot is refreshed while the report is editable and frozen when approved.
      </p>
    </section>
  );
}

function formatAmount(value: string) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(
    Number(value),
  );
}
