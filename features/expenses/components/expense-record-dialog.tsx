"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useExpense } from "../hooks/use-expenses";
import { ExpenseDetail } from "./expense-detail";
import { ExpenseEditor } from "./expense-editor";
import { ExpenseVoid } from "./expense-void";
import { ExpenseError, ExpenseLoading } from "./expense-feedback";
import type { ExpenseSelection } from "./expense-table";

export function ExpenseRecordDialog({
  selection,
  canReadShifts,
  onClose,
}: {
  selection: ExpenseSelection;
  canReadShifts: boolean;
  onClose: () => void;
}) {
  const detail = useExpense(selection.record.source, selection.record.id);
  if (detail.isPending || detail.error)
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent data-coms-ui="operational">
          <DialogHeader>
            <DialogTitle>Expense details</DialogTitle>
            <DialogDescription>
              Loading the latest saved record.
            </DialogDescription>
          </DialogHeader>
          {detail.error ? (
            <ExpenseError
              error={detail.error}
              retry={() => void detail.refetch()}
            />
          ) : (
            <ExpenseLoading />
          )}
        </DialogContent>
      </Dialog>
    );
  if (
    detail.data.record.source === "OPERATING" &&
    detail.data.record.status === "RECORDED"
  ) {
    if (selection.mode === "edit")
      return (
        <ExpenseEditor
          record={detail.data.record}
          canReadShifts={canReadShifts}
          onClose={onClose}
        />
      );
    if (selection.mode === "void")
      return <ExpenseVoid record={detail.data.record} onClose={onClose} />;
  }
  return <ExpenseDetail data={detail.data} onClose={onClose} />;
}
