"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CatalogDiscardConfirmation } from "@/features/catalogs/components/catalog-discard-confirmation";
import { CatalogEditorFields } from "@/features/catalogs/components/catalog-editor-fields";
import { SupplierCreateFields } from "@/features/catalogs/components/supplier-create-fields";
import { StockItemCreateFields } from "@/features/stock-items/components/stock-item-create-fields";
import type {
  CatalogCreateAction,
  CatalogFieldDefinition,
  CatalogRecord,
  CatalogUpdateAction,
} from "@/features/catalogs/types/catalog.types";

function initialValues(
  fields: CatalogFieldDefinition[],
  record: CatalogRecord | null,
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = record?.[field.key];
      return [field.key, typeof value === "string" ? value : ""];
    }),
  );
}

function CatalogCreateFields({
  layout,
  fields,
  values,
  pending,
  onChange,
}: {
  layout: "supplier" | "stock-item";
  fields: CatalogFieldDefinition[];
  values: Record<string, string>;
  pending: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
      {layout === "supplier" ? (
        <SupplierCreateFields
          fields={fields}
          values={values}
          pending={pending}
          onChange={onChange}
        />
      ) : (
        <StockItemCreateFields
          fields={fields}
          values={values}
          pending={pending}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function dialogDescription(
  resourceName: string,
  record: CatalogRecord | null,
  createLayout: "supplier" | "stock-item" | null,
) {
  if (record) return `Update the saved ${resourceName} details.`;
  if (createLayout === "supplier")
    return "Add a supplier for commissary receiving. Contact details can be added now or later.";
  if (createLayout === "stock-item")
    return "Define an item and the unit used to track its stock across COMS.";
  return `Add a new ${resourceName} to the catalog.`;
}

export function CatalogEditorDialog({
  open,
  record,
  resourceName,
  fields,
  createAction,
  updateAction,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  record: CatalogRecord | null;
  resourceName: string;
  fields: CatalogFieldDefinition[];
  createAction: CatalogCreateAction;
  updateAction: CatalogUpdateAction;
  onOpenChange: (open: boolean) => void;
  onComplete: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    initialValues(fields, record),
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const resourceLabel = resourceName[0]?.toUpperCase() + resourceName.slice(1);
  const createLayout = record
    ? null
    : resourceName === "supplier"
      ? "supplier"
      : resourceName === "stock item"
        ? "stock-item"
        : null;
  const isDesignedCreate = createLayout !== null;
  const idPrefix = resourceName.replaceAll(" ", "-");
  const originalValues = initialValues(fields, record);
  const isDirty = fields.some(
    (field) => values[field.key] !== originalValues[field.key],
  );

  function requestClose() {
    if (pending) return;
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function changeValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = Object.fromEntries(
      fields.map((field) => {
        const value = values[field.key]?.trim() ?? "";
        return [field.key, value || (field.required ? "" : null)];
      }),
    );
    setPending(true);
    let result;
    try {
      result = record
        ? await updateAction(record.id, payload)
        : await createAction(payload);
    } catch {
      setPending(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onComplete(`${resourceLabel} ${record ? "updated" : "created"}.`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        requestClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className={
          isDesignedCreate
            ? `flex max-h-[90dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 ${createLayout === "supplier" ? "sm:max-w-[40rem]" : "sm:max-w-xl"}`
            : "max-h-[85vh] overflow-y-auto sm:max-w-lg"
        }
      >
        <DialogHeader
          className={
            isDesignedCreate ? "shrink-0 px-5 pt-6 pb-1 sm:px-7" : undefined
          }
        >
          <DialogTitle>
            {record ? `Edit ${resourceName}` : `Create ${resourceName}`}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription(resourceName, record, createLayout)}
          </DialogDescription>
        </DialogHeader>
        <form
          className={
            isDesignedCreate
              ? "flex min-h-0 flex-1 flex-col"
              : "flex flex-col gap-5"
          }
          onSubmit={submit}
        >
          {createLayout ? (
            <CatalogCreateFields
              layout={createLayout}
              fields={fields}
              values={values}
              pending={pending}
              onChange={changeValue}
            />
          ) : (
            <CatalogEditorFields
              idPrefix={idPrefix}
              fields={fields}
              values={values}
              pending={pending}
              onChange={changeValue}
            />
          )}
          {error && (
            <p
              role="alert"
              className={
                isDesignedCreate
                  ? "shrink-0 px-5 pb-2 text-sm text-destructive sm:px-7"
                  : "text-sm text-destructive"
              }
            >
              {error}
            </p>
          )}
          <DialogFooter
            className={
              isDesignedCreate
                ? "shrink-0 flex-row border-t bg-muted/30 px-5 py-4 sm:px-7"
                : undefined
            }
          >
            <Button
              type="button"
              variant="outline"
              className={
                isDesignedCreate
                  ? "h-10 flex-1 sm:min-w-24 sm:flex-none"
                  : undefined
              }
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className={
                isDesignedCreate
                  ? "h-10 flex-1 sm:min-w-36 sm:flex-none"
                  : undefined
              }
            >
              {pending
                ? "Saving…"
                : record
                  ? `Save ${resourceName}`
                  : `Create ${resourceName}`}
            </Button>
          </DialogFooter>
        </form>
        <CatalogDiscardConfirmation
          resourceName={resourceName}
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
