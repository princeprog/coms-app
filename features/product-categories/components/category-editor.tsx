"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CatalogDiscardConfirmation } from "@/features/catalogs/components/catalog-discard-confirmation";
import { UnsavedNavigationGuard } from "@/components/shared/unsaved-navigation-guard";
import {
  categoryNameSchema,
  type ProductCategory,
} from "../schemas/product-category.schema";
import { useCategorySave } from "../hooks/use-category-mutations";

export function CategoryEditor({
  record,
  onClose,
}: {
  record: ProductCategory | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(record?.name ?? "");
  const [invalid, setInvalid] = useState("");
  const [discard, setDiscard] = useState(false);
  const dirty = name !== (record?.name ?? "");
  const mutation = useCategorySave(() => {
    toast.success(record ? "Category saved." : "Category created.");
    onClose();
  });
  useEffect(() => {
    if (!dirty && !mutation.isPending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mutation.isPending]);
  function close() {
    if (mutation.isPending) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent data-coms-ui="operational" className="sm:max-w-md">
        <UnsavedNavigationGuard dirty={dirty} pending={mutation.isPending} />
        <DialogHeader>
          <DialogTitle>
            {record ? "Edit category" : "Create category"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {record
              ? "Update the category name."
              : "New categories are active and available for products."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const parsed = categoryNameSchema.safeParse({ name });
            setInvalid(parsed.success ? "" : parsed.error.issues[0].message);
            if (parsed.success)
              mutation.mutate({ id: record?.id, name: parsed.data.name });
          }}
        >
          <Field data-invalid={Boolean(invalid)}>
            <FieldLabel htmlFor="category-name">
              Name{" "}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Input
              id="category-name"
              autoFocus
              value={name}
              required
              minLength={2}
              maxLength={80}
              disabled={mutation.isPending}
              className="h-10"
              aria-invalid={Boolean(invalid)}
              aria-describedby={invalid ? "category-name-error" : undefined}
              onChange={(event) => setName(event.target.value)}
            />
            {invalid && (
              <FieldError id="category-name-error">{invalid}</FieldError>
            )}
          </Field>
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : record
                  ? "Save category"
                  : "Create category"}
            </Button>
          </DialogFooter>
        </form>
        <CatalogDiscardConfirmation
          resourceName="category"
          open={discard}
          onOpenChange={setDiscard}
          onDiscard={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
