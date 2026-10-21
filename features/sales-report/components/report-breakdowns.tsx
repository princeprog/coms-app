import type { SalesReport } from "../schemas/sales-report.schema";
import { count, percent, peso, serviceLabel } from "../services/report-format";
import { ReportTable } from "./report-table";

const money = (header: string) => ({ header, numeric: true });

export function ReportBreakdowns({ report }: { report: SalesReport }) {
  const costs = report.show_costs;
  const profitColumns = costs
    ? [money("Food cost"), money("Gross profit")]
    : [];
  const profit = (row: {
    food_cost: string | null;
    gross_profit: string | null;
  }) => (costs ? [peso(row.food_cost), peso(row.gross_profit)] : []);
  const share = [money("Sales"), money("Amount"), money("Share")];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ReportTable
        id="report-branches"
        title="Branches"
        className="xl:col-span-2"
        columns={[
          { header: "Branch" },
          money("Sales"),
          money("Net sales"),
          money("Average sale"),
          ...profitColumns,
          money("Cash over/short"),
        ]}
        rows={report.by_branch.map((row) => ({
          key: row.branch_id,
          cells: [
            row.branch_name,
            count(row.sales_count),
            peso(row.net_sales),
            peso(row.average_sale),
            ...profit(row),
            peso(row.cash_difference),
          ],
        }))}
      />
      <ReportTable
        id="report-payments"
        title="Payment methods"
        columns={[{ header: "Method" }, ...share]}
        rows={report.by_payment.map((row) => ({
          key: row.name,
          cells: [
            row.name,
            count(row.sales_count),
            peso(row.amount),
            percent(row.share_percent),
          ],
        }))}
      />
      <ReportTable
        id="report-service"
        title="Dine-in and Takeout"
        columns={[{ header: "Service" }, ...share]}
        rows={report.by_service.map((row) => ({
          key: row.service_type,
          cells: [
            serviceLabel(row.service_type),
            count(row.sales_count),
            peso(row.amount),
            percent(row.share_percent),
          ],
        }))}
      />
      <ReportTable
        id="report-categories"
        title="Categories"
        columns={[
          { header: "Category" },
          money("Qty"),
          money("Net sales"),
          ...(costs ? [money("Gross profit")] : []),
          money("Share"),
        ]}
        rows={report.by_category.map((row) => ({
          key: row.name,
          cells: [
            row.name,
            count(row.quantity),
            peso(row.net_sales),
            ...(costs ? [peso(row.gross_profit)] : []),
            percent(row.share_percent),
          ],
        }))}
      />
      <ReportTable
        id="report-products"
        title="Top products"
        columns={[
          { header: "Product" },
          money("Qty"),
          money("Net sales"),
          ...(costs ? [money("Gross profit")] : []),
        ]}
        rows={report.top_products.map((row) => ({
          key: row.product_id,
          cells: [
            row.name,
            count(row.quantity),
            peso(row.net_sales),
            ...(costs ? [peso(row.gross_profit)] : []),
          ],
        }))}
      />
    </div>
  );
}

export function ReportCashAndStock({ report }: { report: SalesReport }) {
  const { cash, stock } = report;
  const items: [string, string][] = [
    ["Closed shifts", count(cash.closed_shifts)],
    ["Cash over/short (net)", peso(cash.cash_difference)],
    [
      "Short",
      `${peso(cash.short_amount)} · ${cash.short_shifts} shift${cash.short_shifts === 1 ? "" : "s"}`,
    ],
    [
      "Over",
      `${peso(cash.over_amount)} · ${cash.over_shifts} shift${cash.over_shifts === 1 ? "" : "s"}`,
    ],
    ["Approved daily reports", count(stock.approved_reports)],
    ...(report.show_costs
      ? ([
          ["Waste value", peso(stock.waste_value)],
          ["Count variance value", peso(stock.variance_value)],
        ] as [string, string][])
      : []),
  ];
  return (
    <section aria-labelledby="report-cash" className="rounded-xl border">
      <h2 id="report-cash" className="border-b px-4 py-3 font-semibold">
        Cash and stock
      </h2>
      <dl className="grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 sm:[&:nth-last-child(2)]:border-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
