"use client";

import { useState } from "react";
import Form from "next/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [statusChoice, setStatusChoice] = useState(statusFilter);

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <OperationalPageIntro
        description="Review supplier deliveries. Posting a draft records its received stock in commissary inventory."
        count={<Badge variant="secondary">{page.total} receipts</Badge>}
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
        key={search + ":" + statusFilter}
        action="/receipts"
        aria-label="Filter supplier receipts"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.5fr)_auto]"
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
        <Field className="min-w-0">
          <FieldLabel htmlFor="receipt-status">Receipt status</FieldLabel>
          <Select
            value={statusChoice}
            onValueChange={(value) =>
              setStatusChoice((value as typeof statusFilter | null) ?? "all")
            }
          >
            <SelectTrigger id="receipt-status" className="w-full">
              <SelectValue>
                {(value: unknown) =>
                  value === "DRAFT"
                    ? "Draft"
                    : value === "POSTED"
                      ? "Posted"
                      : "All statuses"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="status" value={statusChoice} />
        </Field>
        <Button type="submit" variant="outline" className="w-fit">
          Apply filters
        </Button>
      </Form>
      {page.items.length === 0 ? (
        <OperationalEmptyState
          title={
            search || statusFilter !== "all"
              ? "No supplier receipts match these filters."
              : "No supplier receipts have been recorded yet."
          }
          description={
            search || statusFilter !== "all"
              ? "Change the supplier search or status filter to see more receipts."
              : "Create a draft when a supplier delivery arrives, then post it after review."
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
          status={statusFilter}
        />
      )}
    </div>
  );
}
