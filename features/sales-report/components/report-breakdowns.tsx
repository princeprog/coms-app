import type { SalesReport } from "../schemas/sales-report.schema";
import { count, percent, peso, serviceLabel } from "../services/report-format";
import { ReportShareList } from "./report-share-list";

const sales = (n: number) => `${count(n)} ${n === 1 ? "sale" : "sales"}`;

export function ReportBreakdowns({ report }: { report: SalesReport }) {
  const topSales = Math.max(
    ...report.top_products.map((row) => Number(row.net_sales)),
    0,
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ReportShareList
        id="report-products"
        title="Top products"
        rows={report.top_products.map((row, index) => ({
          key: row.product_id,
          name: `${index + 1}. ${row.name}`,
          detail: `${count(row.quantity)} sold${report.show_costs ? ` · ${peso(row.gross_profit)} profit` : ""}`,
          value: peso(row.net_sales),
          share: topSales ? (Number(row.net_sales) / topSales) * 100 : 0,
        }))}
      />
      <ReportShareList
        id="report-categories"
        title="Categories"
        rows={report.by_category.map((row) => ({
          key: row.name,
          name: row.name,
          detail: `${count(row.quantity)} sold`,
          value: peso(row.net_sales),
          share: Number(row.share_percent ?? 0),
          shareLabel: percent(row.share_percent),
        }))}
      />
      <ReportShareList
        id="report-payments"
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
