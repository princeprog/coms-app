"use client";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { PosShiftGate } from "@/features/shifts/components/pos-shift-gate";
import { useCurrentShift } from "@/features/shifts/hooks/use-current-shift";
import {
  posShiftState,
  sellBlockedReason,
} from "@/features/shifts/services/pos-shift-state";
import { createSalesHref } from "../services/sales-page-params";
import { PosMenuControls } from "./pos-menu-controls";
import type { SalesViewResult } from "../services/sales-page-loader";
import type { SaleCreateAction } from "../types/sale.types";
import { PosCheckout } from "./pos-checkout";
import { SalesPageLink } from "./sales-page-link";
import { OfflinePosBoundary } from "@/features/pos-offline/components/offline-pos-boundary";

export function PosCheckoutSection({
  view,
  createAction,
}: {
  view: Extract<SalesViewResult, { status: "ready" }>;
  createAction: SaleCreateAction;
}) {
  const query = useDirectoryQuery(
    { ...view.filters, branchId: view.selectedBranch.id },
    createSalesHref,
  );
  const shiftQuery = useCurrentShift(view.selectedBranch.id, view.canCreate);
  if (!view.canCreate) return null;
  const shiftState = posShiftState({
    userId: view.currentUserId,
    pending: shiftQuery.isPending,
    error: shiftQuery.error,
    shift: shiftQuery.data,
  });
  const menuPage = view.menuPage ?? {
    items: [],
    total: 0,
    page: 1,
    page_size: 25,
  };
  const { selectedBranch, filters } = view;
  const pages = Math.max(1, Math.ceil(menuPage.total / menuPage.page_size));
  // The register is shown only to the cashier on shift within the business day.
  return <OfflinePosBoundary branchId={selectedBranch.id} cashierId={view.currentUserId} canPrepare={!sellBlockedReason(shiftState)}>
    {(registerDeviceId, noncashOnly) => sellBlockedReason(shiftState) ? (
      <PosShiftGate
        branchId={selectedBranch.id}
        state={shiftState}
        canOperate={view.canOperateShift}
        canReview={view.canReviewShift}
        onChanged={() => void shiftQuery.refresh()}
      />
    ) : (
    <PosCheckout
      key={selectedBranch.id}
      branchId={selectedBranch.id}
      registerDeviceId={registerDeviceId}
      noncashOnly={noncashOnly}
      sellBlocked={sellBlockedReason(shiftState)}
      serviceTypes={selectedBranch.serviceTypes}
      appliedService={filters.serviceType}
      branchActive={selectedBranch.status !== "inactive"}
      menuPage={menuPage}
      menuUnavailable={view.menuIssue === "unavailable"}
      action={createAction}
      menuRefreshing={query.pending}
      onServiceChange={(serviceType) => query.apply({ serviceType })}
      menuFiltered={Boolean(filters.search || filters.categoryId)}
      menuControls={
        <PosMenuControls
          filters={{ ...filters, branchId: selectedBranch.id }}
          categories={view.categories}
          categoriesUnavailable={view.categoriesUnavailable}
          query={query}
        />
      }
      menuPagination={
        pages > 1 && (
          <nav
            aria-label="POS menu pages"
            className="flex flex-wrap justify-between gap-3"
          >
            {filters.page > 1 ? (
              <SalesPageLink
                filters={{ ...filters, page: filters.page - 1 }}
                label="Previous menu page"
              />
            ) : (
              <span />
            )}
            <span className="self-center text-sm text-muted-foreground">
              Page {filters.page} of {pages}
            </span>
            {filters.page < pages && (
              <SalesPageLink
                filters={{ ...filters, page: filters.page + 1 }}
                label="Next menu page"
              />
            )}
          </nav>
        )
      }
    />
  )}</OfflinePosBoundary>;
}
