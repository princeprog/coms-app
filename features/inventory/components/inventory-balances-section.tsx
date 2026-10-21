import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InventoryPage } from "../types/inventory.types";
import type { InventoryAdjustmentAction } from "./inventory-adjustment-dialog";
import { InventoryBalanceTable } from "./inventory-balance-table";
import { InventoryPagination } from "./inventory-pagination";
import { InventoryPendingStatus } from "./inventory-pending-status";
import type { InventoryLevelsControl } from "./inventory-row-actions";

export function InventoryBalancesSection({
  inventory,
  scope,
  branchId,
  search,
  status,
  category,
  stock,
  page,
  isFetching,
  canAdjust,
  adjustAction,
  levels,
  onComplete,
  onClearFilters,
}: {
  inventory: InventoryPage;
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  search: string;
  status?: "active" | "inactive";
  category?: string;
  stock?: "low";
  page: number;
  isFetching: boolean;
  canAdjust: boolean;
  adjustAction: InventoryAdjustmentAction;
  levels?: InventoryLevelsControl;
  onComplete: (message: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <Card
      aria-labelledby="stock-balances-heading"
      aria-busy={isFetching}
      className="min-w-0 gap-0 overflow-hidden py-0"
    >
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex flex-wrap items-baseline gap-2">
              <h3 id="stock-balances-heading">Stock balances</h3>
              <span className="text-sm font-normal text-muted-foreground">
                {inventory.total} {inventory.total === 1 ? "item" : "items"}
              </span>
            </CardTitle>
            <CardDescription className="sr-only">
              Current quantities in each stock item&apos;s unit, listed A–Z.
            </CardDescription>
          </div>
          {isFetching && <InventoryPendingStatus />}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <InventoryBalanceTable
          items={inventory.items}
          scope={scope}
          branchId={branchId}
          hasFilters={Boolean(search || status || category || stock)}
          onClearFilters={onClearFilters}
          canAdjust={canAdjust}
          adjustAction={adjustAction}
          levels={levels}
          onComplete={onComplete}
        />
      </CardContent>
      <CardFooter className="border-t px-4 py-3 sm:px-5">
        <InventoryPagination
          scope={scope}
          branchId={branchId}
          search={search}
          status={status}
          category={category}
          stock={stock}
          page={page}
          pageCount={Math.max(
            1,
            Math.ceil(inventory.total / inventory.page_size),
          )}
          total={inventory.total}
          pageSize={inventory.page_size}
        />
      </CardFooter>
    </Card>
  );
}
