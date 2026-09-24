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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CatalogDiscardConfirmation } from "@/features/catalogs/components/catalog-discard-confirmation";
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
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {record ? `Edit ${resourceName}` : `Create ${resourceName}`}
          </DialogTitle>
          <DialogDescription>
            {record
              ? `Update the saved ${resourceName} details.`
              : `Add a new ${resourceName} to the catalog.`}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <FieldGroup className="gap-4">
            {fields.map((field) => {
              const id = `catalog-${idPrefix}-${field.key}`;
              return (
                <Field key={field.key}>
                  <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      value={values[field.key] ?? ""}
                      required={field.required}
                      maxLength={field.maxLength}
                      disabled={pending}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setValues((current) => ({
                          ...current,
                          [field.key]: value,
                        }));
                      }}
                    />
                  ) : (
                    <Input
                      id={id}
                      type={field.type ?? "text"}
                      value={values[field.key] ?? ""}
                      required={field.required}
                      maxLength={field.maxLength}
                      disabled={pending}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setValues((current) => ({
                          ...current,
                          [field.key]: value,
                        }));
                      }}
                    />
                  )}
                </Field>
              );
            })}
          </FieldGroup>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
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
