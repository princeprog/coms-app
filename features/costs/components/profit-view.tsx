"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import type { useCostQuery } from "../hooks/use-cost-query";
import { costKeys } from "../query-keys";
import { getBranchProfitAction } from "../services/cost-actions";
import { presetRange } from "../services/cost-format";
import { CostRangeFilter } from "./cost-range-filter";
import { CostTableError, CostTableSkeleton } from "./cost-table-state";
import { ProfitBranchTable } from "./profit-branch-table";
import { ProfitProductTable } from "./profit-product-table";
import { ProfitSummary } from "./profit-summary";

export function ProfitView({
  costQuery,
}: {
  costQuery: ReturnType<typeof useCostQuery>;
}) {
  const { query, update } = costQuery;
  const range =
    query.from && query.to
      ? { from: query.from, to: query.to }
      : presetRange("7d");
  const valid = range.from <= range.to;
  const result = useQuery({
    queryKey: costKeys.profit(range.from, range.to),
    queryFn: async () => {
      const response = await getBranchProfitAction(range);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    enabled: valid,
    retry: false,
  });
  const coverage = result.data?.totals.cost_coverage_percent;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CostRangeFilter
          from={range.from}
          to={range.to}
          onChange={(next) => update({ ...next })}
        />
        {valid && (
          <ExportCsvButton
            kind="profit-branches"
            label="Export branches"
            params={range}
            className="h-11 sm:mt-6"
          />
        )}
      </div>
      {!valid ? null : result.isError ? (
        <CostTableError
          label="Profit"
          message={result.error.message}
          onRetry={() => result.refetch()}
        />
      ) : result.isPending ? (
        <CostTableSkeleton label="profit" />
      ) : (
        <>
          <ProfitSummary totals={result.data.totals} />
          {coverage !== null &&
            coverage !== undefined &&
            coverage !== "100" && (
              <Alert>
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>Food cost covers {coverage}% of sales</AlertTitle>
                <AlertDescription>
                  Sales of products without a recipe or with uncosted stock add
                  no food cost. Check the Products and Stock costs tabs.
                </AlertDescription>
              </Alert>
            )}
          <section aria-label="Profit by branch" className="rounded-xl border">
            <ProfitBranchTable
              branches={result.data.branches}
              totals={result.data.totals}
            />
          </section>
          <ProfitProductTable
            costQuery={costQuery}
            range={range}
            branches={result.data.branches}
          />
        </>
      )}
    </div>
  );
}
