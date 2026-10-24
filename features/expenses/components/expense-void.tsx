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
import { useExpenseVoid } from "../hooks/use-expenses";
import {
  useExpenseDraft,
  useExpenseRetryKey,
} from "../hooks/use-expense-draft";
import { correctionSchema } from "../schemas/expense-input.schema";
import type { Expense } from "../schemas/expense.schema";
import { pesos } from "../services/expense-format";
import { ExpenseField } from "./expense-form-controls";
import { ExpenseDiscard } from "./expense-feedback";

export function ExpenseVoid({
  record: initialRecord,
  onClose,
}: {
  record: Expense;
  onClose: () => void;
}) {
  const [record] = useState(initialRecord);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const keyFor = useExpenseRetryKey();
  const mutation = useExpenseVoid(() => {
    toast.add({ type: "success", title: "Expense voided." });
    onClose();
  });
  const exit = useExpenseDraft(Boolean(reason), mutation.isPending, onClose);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) exit.close();
      }}
    >
      <DialogContent data-coms-ui="operational">
        <UnsavedNavigationGuard
          dirty={Boolean(reason)}
          pending={mutation.isPending}
        />
        <DialogHeader>
          <DialogTitle>Void expense?</DialogTitle>
          <DialogDescription>
            {record.description} · {pesos(record.amount)}. This removes the
            expense from recorded spending and preserves its history. Register
            cash and stock remain unchanged. A voided expense cannot be
            restored.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (mutation.isPending) return;
            const parsed = correctionSchema.safeParse({
              reason,
              revision: record.revision,
            });
            setError(parsed.success ? "" : parsed.error.issues[0].message);
            if (parsed.success)
              mutation.mutate({
                id: record.id,
                input: parsed.data,
                key: keyFor(parsed.data),
              });
          }}
        >
          <ExpenseField
            id="expense-void-reason"
            label="Reason for voiding"
            multiline
            maxLength={500}
            value={reason}
            error={error}
            disabled={mutation.isPending}
            onChange={(event) => setReason(event.target.value)}
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
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Voiding…" : "Void expense"}
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
