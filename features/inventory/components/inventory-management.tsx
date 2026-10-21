"use client";

import { PurchaseActions } from "@/features/direct-purchases/components/purchase-actions";
import { RestockProvider } from "@/features/direct-purchases/components/restock-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import { InventoryBalancesSection } from "./inventory-balances-section";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryPageHeading } from "@/features/inventory/components/inventory-page-heading";
import { InventoryScopeFilter } from "@/features/inventory/components/inventory-scope-filter";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";
import type { InventoryAdjustmentAction } from "@/features/inventory/components/inventory-adjustment-dialog";
import type { InventoryLevelsControl } from "@/features/inventory/components/inventory-row-actions";
import type { SetStockLevelsAction } from "@/features/inventory/services/stock-level-actions";
import type {
  InventoryBranchOption,
  InventoryMovementPage,
  InventoryPage,
} from "@/features/inventory/types/inventory.types";

export function InventoryManagement({
  canReadPurchases = false,
  canCreatePurchases = false,
  inventory,
  movements,
  scope,
  branchOptions,
  selectedBranchId,
  search,
  statusFilter,
  categoryFilter,
  stockFilter,
  canAdjust,
  canSetLevels = false,
  canViewCommissary,
  canViewBranch,
  adjustAction,
  levelsAction,
  branchUnavailable = false,
  branchUnavailableMessage = "No branch is assigned to this account.",
  page,
}: {
  canReadPurchases?: boolean;
  canCreatePurchases?: boolean;
  inventory: InventoryPage | null;
  movements: InventoryMovementPage | null;
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
  statusFilter?: "active" | "inactive";
  categoryFilter?: string;
  stockFilter?: "low";
  canAdjust: boolean;
  canSetLevels?: boolean;
  canViewCommissary: boolean;
  canViewBranch: boolean;
  adjustAction: InventoryAdjustmentAction;
  levelsAction?: SetStockLevelsAction;
  branchUnavailable?: boolean;
  branchUnavailableMessage?: string;
  page?: number;
}) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const currentPage = page ?? inventory?.page ?? 1;
  const branchId = selectedBranchId ?? branchOptions[0]?.id;
  const selectedBranch = branchOptions.find(
    (branch) => branch.id.toLowerCase() === selectedBranchId?.toLowerCase(),
  );
  const isAssignedBranchView = scope === "BRANCH" && !canViewCommissary;
  const branchName = selectedBranch?.name ?? "Assigned branch";
  const levels: InventoryLevelsControl | undefined =
    canSetLevels && levelsAction
      ? scope === "COMMISSARY"
        ? { action: levelsAction, location: { scope: "COMMISSARY" } }
        : branchId
          ? {
              action: levelsAction,
              location: {
                scope: "BRANCH",
                branchId,
                branchName,
                activeBranchIds: branchOptions
                  .filter((branch) => branch.status !== "inactive")
                  .map((branch) => branch.id),
              },
            }
          : undefined
      : undefined;
  return (
    <RestockProvider enabled={canCreatePurchases && scope === "COMMISSARY"}>
      <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <InventoryPageHeading
            isAssignedBranchView={isAssignedBranchView}
            selectedBranchId={selectedBranchId}
            branchName={branchName}
          />
          <div className="flex flex-wrap items-center gap-3">
            {inventory && !branchUnavailable && (
              <ExportCsvButton
                kind={
                  scope === "COMMISSARY"
                    ? "commissary-inventory"
                    : "branch-inventory"
                }
                label="Export stock"
                params={{
                  branch_id: scope === "BRANCH" ? branchId : undefined,
                  search,
                  category: categoryFilter,
                  stock: stockFilter,
                  is_active: statusFilter && String(statusFilter === "active"),
                }}
              />
            )}
            {scope === "COMMISSARY" && (
              <PurchaseActions canRead={canReadPurchases} />
            )}
          </div>
        </div>

        {!branchUnavailable && (
          <InventoryScopeFilter
            scope={scope}
            branchOptions={branchOptions}
            selectedBranchId={branchId}
            search={search}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            stockFilter={stockFilter}
            availableCategories={inventory?.available_categories ?? []}
            canViewCommissary={canViewCommissary}
            canViewBranch={canViewBranch}
            branchName={branchName}
            page={currentPage}
            pageSize={inventory?.page_size}
            onPendingChange={setIsFetching}
          />
        )}

        {scope === "BRANCH" && branchUnavailable ? (
          <OperationalEmptyState
            title="Branch inventory is unavailable"
            description={branchUnavailableMessage}
          />
        ) : inventory && movements ? (
          <>
            {scope === "BRANCH" && selectedBranch?.status === "inactive" && (
              <Badge
                variant="outline"
                className="h-auto min-h-5 max-w-full whitespace-normal"
              >
                Inactive · adjustments disabled
              </Badge>
            )}

            <div className="flex min-w-0 flex-col gap-6">
              <InventoryBalancesSection
                inventory={inventory}
                scope={scope}
                branchId={branchId}
                search={search}
                status={statusFilter}
                category={categoryFilter}
                stock={stockFilter}
                page={currentPage}
                isFetching={isFetching}
                canAdjust={
                  canAdjust &&
                  (scope === "COMMISSARY" ||
                    selectedBranch?.status !== "inactive")
                }
                adjustAction={adjustAction}
                levels={levels}
                onComplete={setStatusMessage}
                onClearFilters={() => {
                  setIsFetching(true);
                  router.replace(
                    createInventoryHref({
                      scope,
                      branchId,
                      page: 1,
                      pageSize: inventory.page_size,
                      search: "",
                    }),
                    { scroll: false },
                  );
                }}
              />
              <InventoryMovementsTable
                movements={movements}
                canReadPurchases={canReadPurchases}
                branchId={scope === "BRANCH" ? branchId : undefined}
              />
            </div>
          </>
        ) : (
          <OperationalLoadError
            title="inventory"
            description="COMS could not load inventory data. Try again in a moment."
          />
        )}

        {statusMessage && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {statusMessage}
          </p>
        )}
      </div>
    </RestockProvider>
  );
}
