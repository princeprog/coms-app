"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import {
  OperationalEmptyState,
  OperationalPageIntro,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import { InventoryBalanceTable } from "@/features/inventory/components/inventory-balance-table";
import { InventoryMovementsTable } from "@/features/inventory/components/inventory-movements-table";
import { InventoryScopeFilter } from "@/features/inventory/components/inventory-scope-filter";
import type { InventoryAdjustmentAction } from "@/features/inventory/components/inventory-adjustment-dialog";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";
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
    (branch) => branch.id === selectedBranchId,
  );
  const rangeStart =
    inventory && inventory.total > 0
      ? (currentPage - 1) * inventory.page_size + 1
      : 0;
  const rangeEnd = inventory
    ? Math.min(currentPage * inventory.page_size, inventory.total)
    : 0;

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <OperationalPageIntro
        description="Review stock balances and the ledger of receipts, transfers, sales, and adjustments."
        count={
          inventory ? (
            <Badge variant="outline">
              {inventory.total}{" "}
              {inventory.total === 1 ? "stock item" : "stock items"}
            </Badge>
          ) : undefined
        }
      />

      <InventoryScopeFilter
        key={scope + ":" + (branchId ?? "none") + ":" + search}
        scope={scope}
        branchOptions={branchOptions}
        selectedBranchId={branchId}
        search={search}
      />

      {scope === "BRANCH" && branchUnavailable ? (
        <OperationalEmptyState
          title="Branch inventory is unavailable"
          description={branchUnavailableMessage}
        />
      ) : inventory && movements ? (
        <>
          {scope === "BRANCH" && selectedBranchId && (
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

          <InventoryBalanceTable
            items={inventory.items}
            scope={scope}
            branchId={selectedBranchId}
            search={search}
            canAdjust={
              canAdjust &&
              (scope === "COMMISSARY" || selectedBranch?.status !== "inactive")
            }
            adjustAction={adjustAction}
            onComplete={setStatus}
          />
          <OperationalPagination
            ariaLabel="Inventory pages"
            page={currentPage}
            pageCount={pageCount}
            previousHref={
              currentPage > 1
                ? createInventoryHref({
                    scope,
                    branchId,
                    page: currentPage - 1,
                    search,
                  })
                : undefined
            }
            nextHref={
              currentPage < pageCount
                ? createInventoryHref({
                    scope,
                    branchId,
                    page: currentPage + 1,
                    search,
                  })
                : undefined
            }
            resultSummary={
              "Showing " +
              rangeStart +
              "–" +
              rangeEnd +
              " of " +
              inventory.total
            }
          />
          <InventoryMovementsTable movements={movements} />
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
