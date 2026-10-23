"use client";
import { useState, type FormEvent } from "react";
import type {
  CatalogCreateAction,
  CatalogFieldDefinition,
  CatalogRecord,
  CatalogUpdateAction,
} from "../types/catalog.types";
function initialValues(
  fields: CatalogFieldDefinition[],
  record: CatalogRecord | null,
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = record?.[field.key];
      return [
        field.key,
        Array.isArray(value)
          ? value.join(",")
          : typeof value === "string" || typeof value === "boolean"
            ? String(value)
            : (field.defaultValue ?? ""),
      ];
    }),
  );
}

export function useCatalogEditor({
  record,
  resourceName,
  fields,
  createAction,
  updateAction,
  onOpenChange,
  onComplete,
}: {
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
  const createLayout: "supplier" | "stock-item" | "payment-method" | null =
    resourceName === "payment method"
      ? "payment-method"
      : resourceName === "stock item"
        ? "stock-item"
        : !record && resourceName === "supplier"
          ? "supplier"
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
    if (pending) return;
    setError("");
    const missingChoice = fields.find(
      (field) =>
        field.required &&
        field.type === "choices" &&
        !values[field.key]?.trim(),
    );
    if (missingChoice) {
      setError(`Select at least one ${missingChoice.label.toLowerCase()}.`);
      return;
    }
    const payload = Object.fromEntries(
      fields.map((field) => {
        const value = values[field.key]?.trim() ?? "";
        return [
          field.key,
          field.type === "checkbox"
            ? value === "true"
            : field.type === "choices"
              ? value.split(",").filter(Boolean)
              : value || (field.required ? "" : null),
        ];
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

  return {
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
  };
}
