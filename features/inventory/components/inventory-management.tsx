"use client";

import { PurchaseActions } from "@/features/direct-purchases/components/purchase-actions";
import { RestockProvider } from "@/features/direct-purchases/components/restock-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { InventoryBalancesSection } from "./inventory-balances-section";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryPageHeading } from "@/features/inventory/components/inventory-page-heading";
import { InventoryScopeFilter } from "@/features/inventory/components/inventory-scope-filter";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";
import type { InventoryAdjustmentAction } from "@/features/inventory/components/inventory-adjustment-dialog";
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
  canAdjust,
  canViewCommissary,
  canViewBranch,
  adjustAction,
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
  canAdjust: boolean;
  canViewCommissary: boolean;
  canViewBranch: boolean;
  adjustAction: InventoryAdjustmentAction;
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
  return (
    <RestockProvider enabled={canCreatePurchases && scope === "COMMISSARY"}>
      <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <InventoryPageHeading
            isAssignedBranchView={isAssignedBranchView}
            selectedBranchId={selectedBranchId}
            branchName={branchName}
          />
          {scope === "COMMISSARY" && (
            <PurchaseActions canRead={canReadPurchases} />
          )}
        </div>

        {!branchUnavailable && (
          <InventoryScopeFilter
            scope={scope}
            branchOptions={branchOptions}
            selectedBranchId={branchId}
            search={search}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
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
                page={currentPage}
                isFetching={isFetching}
                canAdjust={
                  canAdjust &&
                  (scope === "COMMISSARY" ||
                    selectedBranch?.status !== "inactive")
                }
                adjustAction={adjustAction}
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
