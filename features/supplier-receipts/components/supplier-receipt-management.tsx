"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import type {
  SupplierReceiptCreateAction,
  SupplierReceiptFormOptions,
  SupplierReceiptPage,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import { SupplierReceiptCreateDialog } from "./supplier-receipt-create-dialog";
import { SupplierReceiptPagination } from "./supplier-receipt-pagination";
import { SupplierReceiptTable } from "./supplier-receipt-table";
import { SupplierReceiptFilter } from "./supplier-receipt-filter";
import type { SupplierReceiptPageFilters } from "../services/supplier-receipt-page-params";

export function SupplierReceiptManagement({
  page,
  search,
  filters,
  canCreate,
  formOptions,
  formOptionsIssue,
  createAction,
}: {
  page: SupplierReceiptPage;
  search: string;
  filters?: SupplierReceiptPageFilters;
  canCreate: boolean;
  formOptions: SupplierReceiptFormOptions | null;
  formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
  createAction: SupplierReceiptCreateAction;
}) {
  const appliedFilters = filters ?? { page: page.page, search };
  const hasFilters = Boolean(
    search ||
    appliedFilters.received_from ||
    appliedFilters.received_to ||
    appliedFilters.min_cost ||
    appliedFilters.max_cost,
  );
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const canCreateWithOptions = Boolean(
    canCreate && formOptions?.suppliers.length && formOptions.stockItems.length,
  );
  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
      <section
        aria-labelledby="supplier-receiving-heading"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="supplier-receiving-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            Supplier Receiving
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Record deliveries from suppliers and review the quantities added to
            commissary inventory.
          </p>
        </div>
        {canCreateWithOptions && (
          <SupplierReceiptCreateDialog
            suppliers={formOptions!.suppliers}
            stockItems={formOptions!.stockItems}
            action={createAction}
          />
        )}
      </section>
      {canCreate && !canCreateWithOptions && (
        <Alert role={formOptionsIssue ? "alert" : "status"}>
          <AlertDescription>
            {formOptionsIssue === "permissions"
              ? "Supplier and stock-item read permissions are required to prepare a receipt."
              : formOptionsIssue
                ? "Receipt catalog options could not be loaded. Refresh this page to try again."
                : "Add an active supplier and stock item before creating a receipt."}
          </AlertDescription>
        </Alert>
      )}
      <SupplierReceiptFilter filters={appliedFilters} />
      <Card className="min-w-0 gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle>
            <h3>Supplier deliveries</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {page.items.length === 0 ? (
            <OperationalEmptyState
              title={
                hasFilters
                  ? "No supplier receipts match these filters."
                  : "No supplier receipts have been recorded yet."
              }
              description={
                hasFilters
                  ? "Change or clear the filters to see more deliveries."
                  : "Record a supplier delivery when the goods arrive. Saving it adds the quantities to commissary inventory immediately."
              }
            />
          ) : (
            <SupplierReceiptTable page={page} />
          )}
        </CardContent>
        <CardFooter className="border-t px-4 py-3 sm:px-5">
          <SupplierReceiptPagination
            page={page.page}
            pageCount={pageCount}
            search={search}
            filters={appliedFilters}
            total={page.total}
            pageSize={page.page_size}
            itemCount={page.items.length}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
