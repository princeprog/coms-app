import type { SalesReport } from "../schemas/sales-report.schema";
import { count, percent, peso, serviceLabel } from "../services/report-format";
import { ReportCategoryChart } from "./report-category-chart";
import { ReportShareList } from "./report-share-list";
import { ReportTopProductsChart } from "./report-top-products-chart";

const sales = (n: number) => `${count(n)} ${n === 1 ? "sale" : "sales"}`;

export function ReportBreakdowns({ report }: { report: SalesReport }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportTopProductsChart report={report} />
      <ReportCategoryChart report={report} />
      <ReportShareList
        id="report-payments"
        color="sky"
        title="Payment methods"
        rows={report.by_payment.map((row) => ({
          key: row.name,
          name: row.name,
          detail: sales(row.sales_count),
          value: peso(row.amount),
          share: Number(row.share_percent ?? 0),
          shareLabel: percent(row.share_percent),
        }))}
      />
      <ReportShareList
        id="report-service"
        color="emerald"
        title="Dine-in and Takeout"
        rows={report.by_service.map((row) => ({
          key: row.service_type,
          name: serviceLabel(row.service_type),
          detail: sales(row.sales_count),
          value: peso(row.amount),
          share: Number(row.share_percent ?? 0),
          shareLabel: percent(row.share_percent),
        }))}
      />
    </div>
  );
}
