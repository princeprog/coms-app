"use client";
import type { ExpenseInput } from "../schemas/expense-input.schema";
import { ExpenseField } from "./expense-form-controls";
export function ExpenseSupportingFields({
  draft,
  update,
  errors,
  pending,
}: {
  draft: ExpenseInput;
  update: (change: Partial<ExpenseInput>) => void;
  errors: Record<string, string>;
  pending: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <ExpenseField
          id="edit-expense-payee"
          label="Payee (optional)"
          value={draft.payee ?? ""}
          maxLength={160}
          disabled={pending}
          error={errors.payee}
          onChange={(event) => update({ payee: event.target.value })}
        />
        <ExpenseField
          id="edit-expense-reference"
          label="Reference (optional)"
          value={draft.reference ?? ""}
          maxLength={100}
          disabled={pending}
          error={errors.reference}
          onChange={(event) => update({ reference: event.target.value })}
        />
      </div>
      <ExpenseField
        id="edit-expense-notes"
        label="Notes (optional)"
        multiline
        value={draft.notes ?? ""}
        maxLength={1000}
        disabled={pending}
        error={errors.notes}
        onChange={(event) => update({ notes: event.target.value })}
      />
    </>
  );
}
