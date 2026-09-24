import Form from "next/form";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PosCheckout } from "@/features/sales/components/pos-checkout";
import { PosBranchSelector } from "@/features/sales/components/pos-branch-selector";
import { SaleDetailSheet } from "@/features/sales/components/sale-detail-sheet";
import { SalesHistoryTable } from "@/features/sales/components/sales-history-table";
import { SalesPageLink } from "@/features/sales/components/sales-page-link";
import { createSalesHref } from "@/features/sales/services/sales-page-params";
import type { SalesViewResult } from "@/features/sales/services/sales-page-loader";
import type {
  SaleCreateAction,
  SaleVoidAction,
} from "@/features/sales/types/sale.types";

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
  const { branchOptions, selectedBranch, filters } = view;
  const menuPageCount = view.menuPage
    ? Math.max(1, Math.ceil(view.menuPage.total / view.menuPage.page_size))
    : 1;

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Record branch sales and review their saved prices, tender method, and
        stock history. COMS confirms the final total and inventory at
        submission.
      </p>

      <PosBranchSelector
        branches={branchOptions}
        selectedBranchId={selectedBranch.id}
      />

      {view.menuIssue === "permissions" && (
        <p role="alert" className="rounded-lg border p-4 text-sm">
          The branch_products.read permission is required to load the POS menu.
          Ask an administrator to update your role.
        </p>
      )}
      {view.menuIssue === "unavailable" && (
        <p role="alert" className="rounded-lg border p-4 text-sm">
          COMS could not load branch products. Refresh this page to try again.
        </p>
      )}
      {view.menuIssue === "inactive" && (
        <p role="status" className="rounded-lg border p-4 text-sm">
          This branch is inactive. You can review its sales history, but new
          sales cannot be recorded.
        </p>
      )}

      {view.menuPage && view.canCreate && (
        <>
          <Form
            action="/pos"
            aria-label="Search products"
            className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
          >
            <input type="hidden" name="branch_id" value={selectedBranch.id} />
            <input
              type="hidden"
              name="history_page"
              value={filters.historyPage}
            />
            {filters.saleId && (
              <input type="hidden" name="sale_id" value={filters.saleId} />
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="pos-search" className="text-sm font-medium">
                Search menu
              </label>
              <Input
                id="pos-search"
                name="search"
                type="search"
                maxLength={100}
                defaultValue={filters.search}
              />
            </div>
            <Button type="submit" variant="outline">
              Search products
            </Button>
          </Form>
          <PosCheckout
            key={selectedBranch.id}
            branchId={selectedBranch.id}
            branchActive={selectedBranch.status !== "inactive"}
            menuPage={view.menuPage}
            action={createAction}
          />
          {menuPageCount > 1 && (
            <nav
              aria-label="POS menu pages"
              className="flex justify-between gap-3"
            >
              {filters.page > 1 ? (
                <SalesPageLink
                  filters={{ ...filters, page: filters.page - 1 }}
                  label="Previous menu page"
                />
              ) : (
                <span />
              )}
              {filters.page < menuPageCount && (
                <SalesPageLink
                  filters={{ ...filters, page: filters.page + 1 }}
                  label="Next menu page"
                />
              )}
            </nav>
          )}
        </>
      )}

      {view.historyIssue === "permissions" && (
        <Card>
          <CardContent className="py-5">
            <p role="status" className="text-sm">
              The sales.read permission is required to view sale history. You
              can still record sales at this branch.
            </p>
          </CardContent>
        </Card>
      )}
      {view.historyIssue === "unavailable" && (
        <p role="alert" className="rounded-3xl border p-4 text-sm">
          COMS could not load sales history. Refresh this page to try again.
        </p>
      )}
      {view.salesPage && (
        <SalesHistoryTable page={view.salesPage} filters={filters} />
      )}

      {view.detailIssue && (
        <p
          role={view.detailIssue === "permissions" ? "status" : "alert"}
          className="rounded-lg border p-4 text-sm"
        >
          {view.detailIssue === "permissions"
            ? "The sales.read permission is required to view sale details."
            : view.detailIssue === "not-found"
              ? "That sale is no longer available at this branch."
              : "COMS could not load this sale. Refresh the page to try again."}
        </p>
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
