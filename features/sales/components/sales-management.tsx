"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PosCheckoutSection } from "./pos-checkout-section";
import { PosBranchSelector } from "./pos-branch-selector";
import { SaleDetailSheet } from "./sale-detail-sheet";
import { SalesHistoryTable } from "./sales-history-table";
import { createSalesHref } from "../services/sales-page-params";
import type { SalesViewResult } from "../services/sales-page-loader";
import type { SaleCreateAction, SaleVoidAction } from "../types/sale.types";

type ReadySalesView = Extract<SalesViewResult, { status: "ready" }>;

export function SalesManagement({
  view,
  createAction,
  voidAction,
}: {
  view: ReadySalesView;
  createAction: SaleCreateAction;
  voidAction: SaleVoidAction;
}) {
  const router = useRouter();
  const { branchOptions, selectedBranch, filters } = view;
  const initial =
    (filters.view === "history" && view.canRead) || !view.canCreate
      ? "history"
      : "checkout";
  const [selection, setSelection] = useState({
    applied: initial,
    value: initial,
  });
  if (selection.applied !== initial)
    setSelection({ applied: initial, value: initial });
  const active = selection.value;
  const messages = {
    permissions:
      "Menu access is required to load products for checkout. Ask an administrator to update your role.",
    unavailable:
      "Products couldn’t be loaded. Your current order is preserved.",
    inactive:
      "This branch is inactive. Saved sales remain available, but new sales cannot be recorded.",
  };
  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-5">
      <Tabs
        value={active}
        onValueChange={(value) => {
          const next = value === "history" ? "history" : "checkout";
          setSelection({ applied: initial, value: next });
          router.replace(
            createSalesHref({ ...filters, saleId: undefined, view: next }),
            { scroll: false },
          );
        }}
        className="min-w-0 gap-5"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-semibold tracking-tight">
              Point of Sale
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedBranch.name}
            </p>
          </div>
          <TabsList variant="line" aria-label="Point of Sale sections">
            {view.canCreate && (
              <TabsTrigger value="checkout">Checkout</TabsTrigger>
            )}
            {view.canRead && (
              <TabsTrigger value="history">Sales history</TabsTrigger>
            )}
          </TabsList>
        </header>
        {branchOptions.length > 1 && (
          <PosBranchSelector
            branches={branchOptions}
            selectedBranchId={selectedBranch.id}
            view={active as "checkout" | "history"}
          />
        )}
        {view.menuIssue && (
          <Alert role={view.menuIssue === "inactive" ? "status" : "alert"}>
            <AlertDescription>
              {messages[view.menuIssue]}
              {view.menuIssue === "unavailable" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-fit"
                  onClick={() => router.refresh()}
                >
                  Retry products
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        <TabsContent value="checkout" keepMounted>
          <PosCheckoutSection view={view} createAction={createAction} />
        </TabsContent>
        <TabsContent value="history" keepMounted>
          {view.historyIssue === "unavailable" && (
            <Alert variant="destructive">
              <AlertDescription>
                Unable to load sales history. Refresh the page to try again.
              </AlertDescription>
            </Alert>
          )}
          {view.salesPage && (
            <SalesHistoryTable
              page={view.salesPage}
              filters={{ ...filters, view: "history" }}
            />
          )}
        </TabsContent>
      </Tabs>
      {view.detailIssue && (
        <Alert role={view.detailIssue === "permissions" ? "status" : "alert"}>
          <AlertDescription>
            {view.detailIssue === "permissions"
              ? "Sale details are unavailable with your current access."
              : view.detailIssue === "not-found"
                ? "That sale is no longer available at this branch."
                : "Unable to load this sale. Refresh the page to try again."}
          </AlertDescription>
        </Alert>
      )}
      {view.selectedSale && (
        <SaleDetailSheet
          sale={view.selectedSale}
          branchId={selectedBranch.id}
          filters={filters}
          canVoid={view.canVoid}
          voidAction={voidAction}
        />
      )}
      {!view.selectedSale && filters.saleId && view.detailIssue && (
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={createSalesHref({ ...filters, saleId: undefined })}
        >
          Back to point of sale
        </Link>
      )}
    </div>
  );
}
