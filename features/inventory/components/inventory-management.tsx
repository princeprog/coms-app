"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-wrap items-center justify-between gap-4"
        aria-label="Inventory summary"
      >
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review current stock and the ledger of receipts, transfers, sales, and
          adjustments.
        </p>
        {inventory && (
          <Badge variant="outline">
            {inventory.total}{" "}
            {inventory.total === 1 ? "stock item" : "stock items"}
          </Badge>
        )}
      </section>

      <InventoryScopeFilter
        scope={scope}
        branchOptions={branchOptions}
        selectedBranchId={branchId}
        search={search}
      />

      {scope === "BRANCH" && branchUnavailable ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Branch inventory is unavailable.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {branchUnavailableMessage}
            </p>
          </CardContent>
        </Card>
      ) : inventory && movements ? (
        <>
          {scope === "BRANCH" && selectedBranchId && (
            <p className="text-sm text-muted-foreground">
              Branch: {selectedBranch?.name ?? "Assigned branch"}
              {selectedBranch?.status === "inactive" &&
                " (inactive; adjustments are disabled)"}
            </p>
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
          {pageCount > 1 && (
            <nav
              aria-label="Inventory pages"
              className="flex items-center justify-between gap-4"
            >
              {currentPage > 1 ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={createInventoryHref({
                    scope,
                    branchId,
                    page: currentPage - 1,
                    search,
                  })}
                >
                  Previous page
                </Link>
              ) : (
                <Button type="button" variant="outline" disabled>
                  Previous page
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              {currentPage < pageCount ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={createInventoryHref({
                    scope,
                    branchId,
                    page: currentPage + 1,
                    search,
                  })}
                >
                  Next page
                </Link>
              ) : (
                <Button type="button" variant="outline" disabled>
                  Next page
                </Button>
              )}
            </nav>
          )}
          <InventoryMovementsTable movements={movements} />
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Inventory data could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh the page to try again.
            </p>
          </CardContent>
        </Card>
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
