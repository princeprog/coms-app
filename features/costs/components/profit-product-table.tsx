"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DirectorySelect } from "@/components/shared/directory-select";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { useCostQuery } from "../hooks/use-cost-query";
import { costKeys } from "../query-keys";
import type { BranchProfitRow } from "../schemas/cost.schema";
import { getProductProfitAction } from "../services/cost-actions";
import { formatPercent, formatPeso } from "../services/cost-format";
import { CostTableFooter } from "./cost-table-footer";
import {
  CostTableEmpty,
  CostTableError,
  CostTableSkeleton,
} from "./cost-table-state";

export function ProfitProductTable({
  costQuery,
  range,
  branches,
}: {
  costQuery: ReturnType<typeof useCostQuery>;
  range: { from: string; to: string };
  branches: BranchProfitRow[];
}) {
  const { query, update } = costQuery;
  const input = {
    ...range,
    branch_id: query.branch,
    page: query.page,
    page_size: query.page_size,
  };
  const result = useQuery({
    queryKey: costKeys.productProfit(input),
    queryFn: async () => {
      const response = await getProductProfitAction(input);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    retry: false,
  });
  return (
    <section aria-labelledby="profit-products" className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <h2 id="profit-products" className="font-semibold">
          Profit by product
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 1 && (
            <DirectorySelect
              id="profit-branch"
              label="Branch"
              hideLabel
              alignItemWithTrigger={false}
              className="sm:w-60 [&_[data-slot=select-trigger]]:h-10"
              value={query.branch ?? "all"}
              options={[
                { value: "all", label: "All branches" },
                ...branches.map((branch) => ({
                  value: branch.branch_id!,
                  label: branch.branch_name,
                })),
              ].map((option) => ({
                ...option,
                icon: <Building2 className="text-sky-600" />,
              }))}
              onChange={(value) =>
                update({ branch: value === "all" ? undefined : value })
              }
            />
          )}
          <ExportCsvButton
            kind="profit-products"
            label="Export products"
            params={{ ...range, branch_id: query.branch }}
            className="h-10"
          />
        </div>
      </div>
      {result.isError ? (
        <CostTableError
          label="Product profit"
          message={result.error.message}
          onRetry={() => result.refetch()}
        />
      ) : result.isPending ? (
        <CostTableSkeleton label="product profit" />
      ) : result.data.items.length === 0 ? (
        <CostTableEmpty
          title="No sales in this period"
          description="Completed sales appear here with their food cost."
        />
      ) : (
        <>
          <Table
            aria-label="Profit by product"
            className="min-w-2xl"
            containerProps={{
              role: "region",
              "aria-label": "Profit by product table",
              tabIndex: 0,
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="pl-4">
                  Product
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Units
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Net sales
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Food cost
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Gross profit
                </TableHead>
                <TableHead scope="col" className="pr-4 text-right">
                  Food cost %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.items.map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell className="pl-4 whitespace-normal">
                    <span className="font-medium">{item.product_name}</span>
                    {!item.fully_costed && (
                      <Badge className="ml-2 h-auto bg-amber-600 text-white">
                        Cost incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.units_sold}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPeso(item.net_sales)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPeso(item.food_cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPeso(item.gross_profit)}
                  </TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">
                    {formatPercent(item.food_cost_percent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CostTableFooter
            costQuery={costQuery}
            total={result.data.total}
            label="products"
          />
        </>
      )}
    </section>
  );
}
