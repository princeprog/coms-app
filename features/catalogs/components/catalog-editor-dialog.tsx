"use client";
import { dialogDescription } from "./catalog-dialog-description";

import { useCatalogEditor } from "./use-catalog-editor";
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
import { CatalogCreateFields } from "./catalog-create-fields";
import type {
  CatalogCreateAction,
  CatalogFieldDefinition,
  CatalogRecord,
  CatalogUpdateAction,
} from "@/features/catalogs/types/catalog.types";

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
  const {
    values,
    error,
    pending,
    discardOpen,
    setDiscardOpen,
    createLayout,
    isDesignedCreate,
    idPrefix,
    requestClose,
    changeValue,
    submit,
  } = useCatalogEditor({
    record,
    resourceName,
    fields,
    createAction,
    updateAction,
    onOpenChange,
    onComplete,
  });

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
            ? `flex max-h-[90dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 ${createLayout === "supplier" ? "sm:max-w-[40rem]" : createLayout === "payment-method" ? "sm:max-w-2xl" : "sm:max-w-xl"}`
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
