"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
import type { StockCostRow } from "../schemas/cost.schema";
import { getStockCostsAction } from "../services/cost-actions";
import { formatPeso } from "../services/cost-format";
import { CostSearchInput } from "./cost-search-input";
import { CostTableFooter } from "./cost-table-footer";
import {
  CostTableEmpty,
  CostTableError,
  CostTableSkeleton,
} from "./cost-table-state";
import { SetStockCostDialog } from "./set-stock-cost-dialog";

function CostSource({ item }: { item: StockCostRow }) {
  if (!item.cost_source)
    return (
      <Badge className="h-auto bg-amber-600 text-white">No cost yet</Badge>
    );
  return (
    <span className="text-sm text-muted-foreground">
      {item.cost_source === "RECEIPT" ? "From receipts" : "Set manually"}
    </span>
  );
}

export function StockCostsView({
  costQuery,
  canManage,
}: {
  costQuery: ReturnType<typeof useCostQuery>;
  canManage: boolean;
}) {
  const { query, update } = costQuery;
  const [editing, setEditing] = useState<StockCostRow | null>(null);
  const input = {
    search: query.search,
    missing_only: query.missing === "true",
    page: query.page,
    page_size: query.page_size,
  };
  const result = useQuery({
    queryKey: costKeys.stock(input),
    queryFn: async () => {
      const response = await getStockCostsAction(input);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    retry: false,
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <CostSearchInput
          id="stock-cost-search"
          label="Search stock items or categories"
          value={query.search}
          onSearch={(search) => update({ search })}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="stock-cost-missing"
            checked={input.missing_only}
            onCheckedChange={(checked) =>
              update({ missing: checked ? "true" : undefined })
            }
          />
          <Label htmlFor="stock-cost-missing">Missing cost only</Label>
        </div>
      </div>
      <section aria-label="Stock costs" className="rounded-xl border">
        {result.isError ? (
          <CostTableError
            label="Stock costs"
            message={result.error.message}
            onRetry={() => result.refetch()}
          />
        ) : result.isPending ? (
          <CostTableSkeleton label="stock costs" />
        ) : result.data.items.length === 0 ? (
          <CostTableEmpty
            title={
              input.missing_only
                ? "Every stock item has a cost"
                : "No stock items match"
            }
            description={
              input.missing_only
                ? "Costs come from deliveries and purchases, or can be set here."
                : "Change the search to see more stock items."
            }
          />
        ) : (
          <>
            <Table
              aria-label="Stock costs"
              className="min-w-2xl"
              containerProps={{
                role: "region",
                "aria-label": "Stock costs table",
                tabIndex: 0,
              }}
            >
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="pl-4">
                    Stock item
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Average cost
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Last receipt cost
                  </TableHead>
                  <TableHead scope="col">Source</TableHead>
                  {canManage && (
                    <TableHead scope="col" className="w-12 pr-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.stock_item_id}>
                    <TableCell className="pl-4 whitespace-normal">
                      <span className="font-medium">
                        {item.stock_item_name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.average_unit_cost
                        ? `${formatPeso(item.average_unit_cost)} / ${item.unit}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.last_unit_cost
                        ? formatPeso(item.last_unit_cost)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <CostSource item={item} />
                    </TableCell>
                    {canManage && (
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${item.stock_item_name}`}
                              />
                            }
                          >
                            <Ellipsis aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            data-coms-ui="operational"
                            align="end"
                          >
                            <DropdownMenuItem onClick={() => setEditing(item)}>
                              <PencilLine aria-hidden="true" />
                              Set cost
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CostTableFooter
              costQuery={costQuery}
              total={result.data.total}
              label="stock items"
            />
          </>
        )}
      </section>
      <SetStockCostDialog
        key={editing?.stock_item_id ?? "closed"}
        item={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
