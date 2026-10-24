"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useExpenseCategorySave } from "../hooks/use-expenses";
import type { ExpenseCategory } from "../schemas/expense.schema";

export function ExpenseCategoryStatus({
  record,
  onClose,
}: {
  record: ExpenseCategory;
  onClose: () => void;
}) {
  const mutation = useExpenseCategorySave(() => {
    toast.add({
      type: "success",
      title: record.is_active ? "Category deactivated." : "Category activated.",
    });
    onClose();
  });
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <AlertDialogContent data-coms-ui="operational">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {record.is_active ? "Deactivate" : "Activate"} {record.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {record.is_active
              ? "New expenses will no longer offer this category. Historical expenses retain their category."
              : "This category will be available for new expenses."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {mutation.error && (
          <p role="alert" className="text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={record.is_active ? "destructive" : "default"}
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                id: record.id,
                input: { is_active: !record.is_active },
              })
            }
          >
            {mutation.isPending
              ? "Saving…"
              : record.is_active
                ? "Deactivate category"
                : "Activate category"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
