"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCostQuery } from "../hooks/use-cost-query";
import type { CostQuery } from "../schemas/cost.schema";
import { ProductCostsView } from "./product-costs-view";
import { ProfitView } from "./profit-view";
import { StockCostsView } from "./stock-costs-view";

const views: { value: CostQuery["view"]; label: string }[] = [
  { value: "profit", label: "Profit" },
  { value: "products", label: "Product costs" },
  { value: "stock", label: "Stock costs" },
];

export function CostsWorkspace({ canManage }: { canManage: boolean }) {
  const costQuery = useCostQuery();
  const { query, update } = costQuery;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Costs &amp; profit
        </h1>
        <p className="text-sm text-muted-foreground">
          Food cost from recipes at weighted-average stock cost.
        </p>
      </header>
      <Tabs
        value={query.view}
        onValueChange={(view) =>
          // Each view keeps its own filters; start fresh when switching.
          update({
            view: view as string,
            search: undefined,
            status: undefined,
            missing: undefined,
            branch: undefined,
          })
        }
      >
        <TabsList aria-label="Cost views">
          {views.map((view) => (
            <TabsTrigger key={view.value} value={view.value}>
              {view.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {query.view === "profit" ? (
        <ProfitView costQuery={costQuery} />
      ) : query.view === "products" ? (
        <ProductCostsView costQuery={costQuery} />
      ) : (
        <StockCostsView costQuery={costQuery} canManage={canManage} />
      )}
    </div>
  );
}
