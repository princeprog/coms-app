"use client";

import { useQuery } from "@tanstack/react-query";
import { ListFilter, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DirectorySelect } from "@/components/shared/directory-select";
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
import { getProductCostsAction } from "../services/cost-actions";
import { formatPercent, formatPeso } from "../services/cost-format";
import { CostSearchInput } from "./cost-search-input";
import { CostTableFooter } from "./cost-table-footer";
import {
  CostTableEmpty,
  CostTableError,
  CostTableSkeleton,
} from "./cost-table-state";

export function ProductCostsView({
  costQuery,
}: {
  costQuery: ReturnType<typeof useCostQuery>;
}) {
  const { query, update } = costQuery;
  const input = {
    search: query.search,
    status: query.status,
    page: query.page,
    page_size: query.page_size,
  };
  const result = useQuery({
    queryKey: costKeys.products(input),
    queryFn: async () => {
      const response = await getProductCostsAction(input);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    retry: false,
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <CostSearchInput
          id="product-cost-search"
          label="Search products"
          value={query.search}
          onSearch={(search) => update({ search })}
        />
        <DirectorySelect
          id="product-cost-status"
          label="Recipe status"
          hideLabel
          alignItemWithTrigger={false}
          className="sm:w-56 [&_[data-slot=select-trigger]]:h-11"
          value={query.status}
          options={[
            {
              value: "all",
              label: "All products",
              icon: <ListFilter className="text-violet-600" />,
            },
            {
              value: "incomplete",
              label: "Needs attention",
              icon: <TriangleAlert className="text-amber-600" />,
            },
          ]}
          onChange={(status) => update({ status })}
        />
      </div>
      <section aria-label="Product costs" className="rounded-xl border">
        {result.isError ? (
          <CostTableError
            label="Product costs"
            message={result.error.message}
            onRetry={() => result.refetch()}
          />
        ) : result.isPending ? (
          <CostTableSkeleton label="product costs" />
        ) : result.data.items.length === 0 ? (
          <CostTableEmpty
            title="No products match"
            description="Change the search or status to see more products."
          />
        ) : (
          <>
            <Table
              aria-label="Product costs"
              className="min-w-3xl"
              containerProps={{
                role: "region",
                "aria-label": "Product costs table",
                tabIndex: 0,
              }}
            >
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="pl-4">
                    Product
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Price
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Dine-in cost
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Takeout cost
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Lowest margin
                  </TableHead>
                  <TableHead scope="col" className="pr-4">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.items.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="pl-4 whitespace-normal">
                      <span className="font-medium">{item.product_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.category_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPeso(item.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPeso(item.dine_in_cost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPeso(item.takeout_cost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.recipe_line_count
                        ? formatPercent(item.lowest_margin_percent)
                        : "—"}
                    </TableCell>
                    <TableCell className="pr-4 whitespace-normal">
                      {item.recipe_line_count === 0 ? (
                        <Badge className="h-auto bg-amber-600 text-white">
                          No recipe
                        </Badge>
                      ) : item.missing_cost_items.length ? (
                        <span className="flex flex-col items-start gap-1">
                          <Badge className="h-auto bg-amber-600 text-white">
                            Missing cost
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.missing_cost_items.join(", ")}
                          </span>
                        </span>
                      ) : (
                        <Badge className="h-auto bg-emerald-700 text-white">
                          Costed
                        </Badge>
                      )}
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
    </div>
  );
}
