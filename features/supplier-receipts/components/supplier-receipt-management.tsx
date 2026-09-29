"use client";

import Form from "next/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
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
  canCreate,
  formOptions,
  formOptionsIssue,
  createAction,
}: {
  page: SupplierReceiptPage;
  search: string;
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
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <OperationalPageIntro
        description="Record deliveries from suppliers and review the quantities added to commissary inventory."
        count={<Badge variant="secondary">{page.total} deliveries</Badge>}
        actions={
          canCreateWithOptions ? (
            <SupplierReceiptCreateDialog
              suppliers={formOptions!.suppliers}
              stockItems={formOptions!.stockItems}
              action={createAction}
            />
          ) : null
        }
      />
      {canCreate && !canCreateWithOptions && (
        <p
          role={formOptionsIssue ? "alert" : "status"}
          className="rounded-lg border bg-card p-4 text-sm"
        >
          {formOptionsIssue === "permissions"
            ? "Supplier and stock-item read permissions are required to prepare a receipt."
            : formOptionsIssue
              ? "Receipt catalog options could not be loaded. Refresh this page to try again."
              : "Add an active supplier and stock item before creating a receipt."}
        </p>
      )}
      <Form
        key={search}
        action="/receipts"
        aria-label="Filter supplier receipts"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
      >
        <Field className="min-w-0">
          <FieldLabel htmlFor="receipt-search">Search supplier</FieldLabel>
          <Input
            id="receipt-search"
            name="search"
            type="search"
            maxLength={100}
            defaultValue={search}
          />
        </Field>
        <Button type="submit" variant="outline" className="w-fit">
          Apply filters
        </Button>
      </Form>
      {page.items.length === 0 ? (
        <OperationalEmptyState
          title={
            search
              ? "No supplier receipts match these filters."
              : "No supplier receipts have been recorded yet."
          }
          description={
            search
              ? "Change the supplier search to see more deliveries."
              : "Record a supplier delivery when the goods arrive. Saving it adds the quantities to commissary inventory immediately."
          }
        />
      ) : (
        <SupplierReceiptTable page={page} />
      )}
      {pageCount > 1 && (
        <SupplierReceiptPagination
          page={page.page}
          pageCount={pageCount}
          search={search}
        />
      )}
    </div>
  );
}
