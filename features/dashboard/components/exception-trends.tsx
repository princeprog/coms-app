"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardExceptions } from "../hooks/use-dashboard-exceptions";
import { businessDayLabel } from "../services/dashboard-format";
import { BranchExceptionsTable } from "./branch-exceptions-table";
import { CashierExceptionsTable } from "./cashier-exceptions-table";

type View = "branches" | "cashiers";

/** Whether cash, count, receiving and void problems are recurring. */
export function ExceptionTrends({ branchId }: { branchId?: string }) {
  const result = useDashboardExceptions(branchId);
  const [view, setView] = useState<View>("branches");
  const data = result.data;
  const showCashiers = Boolean(data?.cashiers);
  const active = showCashiers ? view : "branches";
  const first = data?.week_starts[0];
  return (
    <section
      aria-labelledby="dashboard-exceptions"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id="dashboard-exceptions" className="font-semibold">
            Exception trends
          </h2>
          <p className="text-xs text-muted-foreground">
            {first
              ? `Last 4 weeks from ${businessDayLabel(first)}, today excluded`
              : "Last 4 weeks, today excluded"}
          </p>
        </div>
        {showCashiers && (
          <Tabs
            value={active}
            onValueChange={(value) => setView(value as View)}
          >
            <TabsList aria-label="Exception trends view" className="h-8">
              <TabsTrigger value="branches" className="px-3 text-xs">
                By branch
              </TabsTrigger>
              <TabsTrigger value="cashiers" className="px-3 text-xs">
                By cashier
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      {result.isError && !data ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm"
        >
          <p>{result.error.message}</p>
          <Button variant="outline" onClick={() => result.refetch()}>
            Try again
          </Button>
        </div>
      ) : !data ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading exception trends"
          className="flex flex-col gap-2 p-4"
        >
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      ) : active === "cashiers" && data.cashiers ? (
        <CashierExceptionsTable cashiers={data.cashiers} />
      ) : (
        <BranchExceptionsTable data={data} />
      )}
    </section>
  );
}
