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
import {
  useExpenseCategories,
  useExpenseLocations,
  useExpenseSave,
} from "../hooks/use-expenses";
import {
  useExpenseDraft,
  useExpenseRetryKey,
} from "../hooks/use-expense-draft";
import {
  correctionSchema,
  expenseInputSchema,
} from "../schemas/expense-input.schema";
import type { Expense } from "../schemas/expense.schema";
import { expenseDraft } from "../services/expense-draft";
import { ExpenseEditorFields } from "./expense-editor-fields";
import { ExpenseField } from "./expense-form-controls";
import {
  ExpenseDiscard,
  ExpenseError,
  ExpenseLoading,
} from "./expense-feedback";

export function ExpenseEditor({
  record: initialRecord,
  canReadShifts,
  onClose,
}: {
  record?: Expense;
  canReadShifts: boolean;
  onClose: () => void;
}) {
  const [record] = useState(initialRecord);
  const [initial] = useState(() => expenseDraft(record));
  const [draft, setDraft] = useState(initial);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locations = useExpenseLocations();
  const categories = useExpenseCategories();
  const keyFor = useExpenseRetryKey();
  const save = useExpenseSave(() => {
    toast.add({
      type: "success",
      title: record ? "Expense corrected." : "Expense recorded.",
    });
    onClose();
  });
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) || Boolean(reason);
  const exit = useExpenseDraft(dirty, save.isPending, onClose);
  function submit() {
    if (save.isPending) return;
    const parsed = expenseInputSchema.safeParse(draft);
    const correction = correctionSchema.safeParse({
      revision: record?.revision,
      reason,
    });
    const issues = [
      ...(parsed.error?.issues ?? []),
      ...(record ? (correction.error?.issues ?? []) : []),
    ];
    setErrors(
      Object.fromEntries(
        issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    );
    if (!parsed.success || (record && !correction.success)) return;
    const input = {
      ...parsed.data,
      ...(record && correction.success ? correction.data : {}),
    };
    save.mutate({ id: record?.id, input, key: keyFor(input) });
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) exit.close();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <UnsavedNavigationGuard dirty={dirty} pending={save.isPending} />
        <DialogHeader>
          <DialogTitle>
            {record ? "Edit expense" : "Record expense"}
          </DialogTitle>
          <DialogDescription>
            {record
              ? "Corrections require a reason and remain in this expense’s history."
              : "Operating expenses count immediately in recorded spending."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {locations.isPending || categories.isPending ? (
            <ExpenseLoading />
          ) : locations.error || categories.error ? (
            <ExpenseError
              error={(locations.error ?? categories.error)!}
              retry={() => {
                void locations.refetch();
                void categories.refetch();
              }}
            />
          ) : (
            <ExpenseEditorFields
              draft={draft}
              setDraft={setDraft}
              errors={errors}
              record={record}
              locations={locations.data.items}
              categories={categories.data.items}
              pending={save.isPending}
              canReadShifts={canReadShifts}
            />
          )}
          {record && (
            <ExpenseField
              id="expense-correction-reason"
              label="Reason for correction"
              multiline
              value={reason}
              maxLength={500}
              disabled={save.isPending}
              error={errors.reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
          {save.error && (
            <p role="alert" className="text-sm text-destructive">
              {save.error.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={exit.close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                save.isPending ||
                !locations.data ||
                !categories.data ||
                Boolean(locations.error || categories.error)
              }
            >
              {save.isPending
                ? "Saving…"
                : record
                  ? "Save correction"
                  : "Record expense"}
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
