import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BranchProfitRow } from "../schemas/cost.schema";
import { formatPercent, formatPeso } from "../services/cost-format";

const columns = [
  ["Net sales", "net_sales"],
  ["Food cost", "food_cost"],
  ["Gross profit", "gross_profit"],
  ["Waste value", "waste_value"],
  ["Count variance", "variance_value"],
] as const;

function Row({
  row,
  total = false,
}: {
  row: BranchProfitRow;
  total?: boolean;
}) {
  const Cell = TableCell;
  return (
    <TableRow className={total ? "font-medium" : undefined}>
      <Cell className="pl-4 whitespace-normal">
        {row.branch_name}
        <span className="block text-xs text-muted-foreground">
          {row.sales_count} {row.sales_count === 1 ? "sale" : "sales"}
        </span>
      </Cell>
      {columns.map(([, key]) => (
        <Cell
          key={key}
          className={
            "text-right tabular-nums " +
            (row[key].startsWith("-") ? "text-destructive" : "")
          }
        >
          {formatPeso(row[key])}
        </Cell>
      ))}
      <Cell className="text-right tabular-nums">
        {formatPercent(row.food_cost_percent)}
      </Cell>
      <Cell className="pr-4 text-right tabular-nums">
        {formatPercent(row.cost_coverage_percent)}
      </Cell>
    </TableRow>
  );
}

export function ProfitBranchTable({
  branches,
  totals,
}: {
  branches: BranchProfitRow[];
  totals: BranchProfitRow;
}) {
  return (
    <Table
      aria-label="Profit by branch"
      className="min-w-3xl"
      containerProps={{
        role: "region",
        "aria-label": "Profit by branch table",
        tabIndex: 0,
      }}
    >
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="pl-4">
            Branch
          </TableHead>
          {columns.map(([label]) => (
            <TableHead key={label} scope="col" className="text-right">
              {label}
            </TableHead>
          ))}
          <TableHead scope="col" className="text-right">
            Food cost %
          </TableHead>
          <TableHead scope="col" className="pr-4 text-right">
            Costed sales
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.map((row) => (
          <Row key={row.branch_id} row={row} />
        ))}
      </TableBody>
      {branches.length > 1 && (
        <TableFooter>
          <Row row={totals} total />
        </TableFooter>
      )}
    </Table>
  );
}
