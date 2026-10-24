"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UnsavedNavigationGuard } from "@/components/shared/unsaved-navigation-guard";
import { useExpenseCategorySave } from "../hooks/use-expenses";
import { useExpenseDraft } from "../hooks/use-expense-draft";
import { categoryInputSchema } from "../schemas/expense-input.schema";
import type { ExpenseCategory } from "../schemas/expense.schema";
import { ExpenseField } from "./expense-form-controls";
import { ExpenseDiscard } from "./expense-feedback";

export function ExpenseCategoryEditor({
  record,
  onClose,
}: {
  record?: ExpenseCategory;
  onClose: () => void;
}) {
  const [name, setName] = useState(record?.name ?? "");
  const [error, setError] = useState("");
  const mutation = useExpenseCategorySave(() => {
    toast.add({
      type: "success",
      title: record ? "Category renamed." : "Category created.",
    });
    onClose();
  });
  const dirty = name !== (record?.name ?? "");
  const exit = useExpenseDraft(dirty, mutation.isPending, onClose);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) exit.close();
      }}
    >
      <DialogContent data-coms-ui="operational">
        <UnsavedNavigationGuard dirty={dirty} pending={mutation.isPending} />
        <DialogHeader>
          <DialogTitle>
            {record ? "Rename category" : "Create expense category"}
          </DialogTitle>
          <DialogDescription>
            Categories organize operating expenses. Stock purchases is reserved
            for imported purchases.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const parsed = categoryInputSchema.safeParse({ name });
            setError(parsed.success ? "" : parsed.error.issues[0].message);
            if (parsed.success)
              mutation.mutate({ id: record?.id, input: parsed.data });
          }}
        >
          <ExpenseField
            id="expense-category-name"
            label="Category name"
            maxLength={80}
            value={name}
            error={error}
            disabled={mutation.isPending}
            onChange={(event) => setName(event.target.value)}
          />
          {mutation.error && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={exit.close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save category"}
            </Button>
          </DialogFooter>
        </form>
        <ExpenseDiscard
          open={exit.discard}
          onOpenChange={exit.setDiscard}
          onDiscard={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
