import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  SupplierReceiptCreateAction,
  SupplierReceiptFormOptions,
  SupplierReceiptPage,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import { SupplierReceiptCreateDialog } from "./supplier-receipt-create-dialog";
import { SupplierReceiptPagination } from "./supplier-receipt-pagination";
import { SupplierReceiptTable } from "./supplier-receipt-table";

export function SupplierReceiptManagement({
  page,
  search,
  statusFilter,
  canCreate,
  formOptions,
  formOptionsIssue,
  createAction,
}: {
  page: SupplierReceiptPage;
  search: string;
  statusFilter: "all" | "DRAFT" | "POSTED";
  canCreate: boolean;
  formOptions: SupplierReceiptFormOptions | null;
  formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
  createAction: SupplierReceiptCreateAction;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const canCreateWithOptions = Boolean(
    canCreate && formOptions?.suppliers.length && formOptions.stockItems.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review supplier deliveries. Posting a draft records its received stock
          in commissary inventory.
        </p>
        {canCreateWithOptions && (
          <SupplierReceiptCreateDialog
            suppliers={formOptions!.suppliers}
            stockItems={formOptions!.stockItems}
            action={createAction}
          />
        )}
      </section>
      {canCreate && !canCreateWithOptions && (
        <Card>
          <CardContent className="py-5">
            <p role={formOptionsIssue ? "alert" : "status"} className="text-sm">
              {formOptionsIssue === "permissions"
                ? "Supplier and stock-item read permissions are required to prepare a receipt."
                : formOptionsIssue
                  ? "Receipt catalog options could not be loaded. Refresh this page to try again."
                  : "Add an active supplier and stock item before creating a receipt."}
            </p>
          </CardContent>
        </Card>
      )}
      <form
        action="/receipts"
        method="get"
        aria-label="Filter supplier receipts"
        className="grid gap-3 rounded-4xl border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.5fr)_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="receipt-search" className="text-sm font-medium">
            Search supplier
          </label>
          <Input
            id="receipt-search"
            name="search"
            type="search"
            maxLength={100}
            defaultValue={search}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="receipt-status" className="text-sm font-medium">
            Receipt status
          </label>
          <select
            id="receipt-status"
            name="status"
            defaultValue={statusFilter}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <option value="all">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
          </select>
        </div>
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>
      {page.items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">
              {search || statusFilter !== "all"
                ? "No supplier receipts match these filters."
                : "No supplier receipts have been recorded yet."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Change the supplier search or status filter to see more receipts."
                : "Create a draft when a supplier delivery arrives, then post it after review."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <SupplierReceiptTable page={page} />
      )}
      {pageCount > 1 && (
        <SupplierReceiptPagination
          page={page.page}
          pageCount={pageCount}
          search={search}
          status={statusFilter}
        />
      )}
    </div>
  );
}
