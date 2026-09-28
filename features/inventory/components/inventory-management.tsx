"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { InventoryBalanceTable } from "@/features/inventory/components/inventory-balance-table";
import { InventoryAssignedBranchSearch } from "@/features/inventory/components/inventory-assigned-branch-search";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryPagination } from "@/features/inventory/components/inventory-pagination";
import { InventoryScopeFilter } from "@/features/inventory/components/inventory-scope-filter";
import type { InventoryAdjustmentAction } from "@/features/inventory/components/inventory-adjustment-dialog";
import type {
  InventoryBranchOption,
  InventoryMovementPage,
  InventoryPage,
} from "@/features/inventory/types/inventory.types";

export function InventoryManagement({
  inventory,
  movements,
  scope,
  branchOptions,
  selectedBranchId,
  search,
  canAdjust,
  canViewCommissary,
  canViewBranch,
  adjustAction,
  branchUnavailable = false,
  branchUnavailableMessage = "No branch is assigned to this account.",
  page,
}: {
  inventory: InventoryPage | null;
  movements: InventoryMovementPage | null;
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
  canAdjust: boolean;
  canViewCommissary: boolean;
  canViewBranch: boolean;
  adjustAction: InventoryAdjustmentAction;
  branchUnavailable?: boolean;
  branchUnavailableMessage?: string;
  page?: number;
}) {
  const [status, setStatus] = useState("");
  const currentPage = page ?? inventory?.page ?? 1;
  const pageCount = inventory
    ? Math.max(1, Math.ceil(inventory.total / inventory.page_size))
    : 1;
  const branchId = selectedBranchId ?? branchOptions[0]?.id;
  const selectedBranch = branchOptions.find(
    (branch) => branch.id.toLowerCase() === selectedBranchId?.toLowerCase(),
  );
  const isAssignedBranchView = scope === "BRANCH" && !canViewCommissary;
  const branchName = selectedBranch?.name ?? "Assigned branch";
  return (
    <div
      data-coms-ui="operational"
      className={`flex flex-col ${isAssignedBranchView ? "gap-4" : "gap-5"}`}
    >
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Inventory
            </h2>
            {isAssignedBranchView && selectedBranchId && (
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary"
              >
                <MapPin aria-hidden="true" className="size-3.5" />
                {branchName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isAssignedBranchView && selectedBranchId
              ? `Stock balances and recent movements for ${branchName}.`
              : "Review stock balances and the ledger of receipts, transfers, sales, and adjustments."}
          </p>
        </div>
        {inventory && !isAssignedBranchView && (
          <Badge variant="secondary" className="rounded-full px-4 py-2 text-xs">
            {inventory.total}{" "}
            {inventory.total === 1 ? "stock item" : "stock items"}
          </Badge>
        )}
      </section>

      {isAssignedBranchView ? (
        !branchUnavailable && branchId ? (
          <InventoryAssignedBranchSearch
            branchId={branchId}
            branchName={branchName}
            search={search}
          />
        ) : null
      ) : (
        <InventoryScopeFilter
          key={scope + ":" + (branchId ?? "none") + ":" + search}
          scope={scope}
          branchOptions={branchOptions}
          selectedBranchId={branchId}
          search={search}
          canViewCommissary={canViewCommissary}
          canViewBranch={canViewBranch}
        />
      )}

      {scope === "BRANCH" && branchUnavailable ? (
        <OperationalEmptyState
          title="Branch inventory is unavailable"
          description={branchUnavailableMessage}
        />
      ) : inventory && movements ? (
        <>
          {scope === "BRANCH" && selectedBranchId && !isAssignedBranchView && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">
                {selectedBranch?.name ?? "Assigned branch"}
              </span>
              {selectedBranch?.status === "inactive" && (
                <Badge variant="outline">Inactive · adjustments disabled</Badge>
              )}
            </div>
          )}

          <Card size="sm" className={isAssignedBranchView ? "py-3" : undefined}>
            <CardContent
              className={`flex flex-col ${isAssignedBranchView ? "gap-3" : "gap-4"}`}
            >
              <InventoryBalanceTable
                items={inventory.items}
                total={inventory.total}
                scope={scope}
                branchId={selectedBranchId}
                search={search}
                canAdjust={
                  canAdjust &&
                  (scope === "COMMISSARY" ||
                    selectedBranch?.status !== "inactive")
                }
                adjustAction={adjustAction}
                onComplete={setStatus}
                compact={isAssignedBranchView}
              />
              <InventoryPagination
                scope={scope}
                branchId={branchId}
                search={search}
                page={currentPage}
                pageCount={pageCount}
                total={inventory.total}
                pageSize={inventory.page_size}
              />
            </CardContent>
          </Card>
          <Card size="sm" className={isAssignedBranchView ? "py-3" : undefined}>
            <CardContent>
              <InventoryMovementsTable
                movements={movements}
                compact={isAssignedBranchView}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <OperationalLoadError
          title="inventory"
          description="COMS could not load inventory data. Try again in a moment."
        />
      )}

      {status && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status}
        </p>
      )}
    </div>
  );
}
