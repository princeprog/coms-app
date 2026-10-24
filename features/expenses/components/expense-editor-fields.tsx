"use client";
import type { ExpenseInput } from "../schemas/expense-input.schema";
import type {
  Expense,
  ExpenseCategory,
  ExpenseLocation,
} from "../schemas/expense.schema";
import {
  changeExpenseLocation,
  changeExpensePayment,
} from "../services/expense-draft";
import { manilaToday, paymentLabels } from "../services/expense-format";
import { ExpenseCashOutPicker } from "./expense-cash-out-picker";
import { ExpenseField, ExpenseSelect } from "./expense-form-controls";

import { ExpenseSupportingFields } from "./expense-supporting-fields";

export function ExpenseEditorFields({
  draft,
  setDraft,
  errors,
  record,
  locations,
  categories,
  pending,
  canReadShifts,
}: {
  draft: ExpenseInput;
  setDraft: (draft: ExpenseInput) => void;
  errors: Record<string, string>;
  record?: Expense;
  locations: ExpenseLocation[];
  categories: ExpenseCategory[];
  pending: boolean;
  canReadShifts: boolean;
}) {
  const linked = Boolean(record?.cash_movement_id);
  const update = (change: Partial<ExpenseInput>) =>
    setDraft({ ...draft, ...change });
  const currentLocation =
    draft.branch_id ?? (draft.scope === "COMMISSARY" ? "COMMISSARY" : "");
  const locationOptions = locations
    .filter(
      (item) =>
        item.is_active ||
        (record &&
          item.scope === record.scope &&
          item.branch_id === record.branch_id),
    )
    .map((item) => ({
      value: item.branch_id ?? "COMMISSARY",
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
    }));
  const categoryOptions = categories
    .filter((item) => item.is_active || item.id === record?.category_id)
    .map((item) => ({
      value: item.id,
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
    }));
  return (
    <>
      {linked && (
        <p className="rounded-lg bg-muted p-3 text-sm">
          This expense is linked to a register cash out. Location, amount and
          payment are locked. Void and recreate the expense to correct those
          fields.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <ExpenseField
          id="edit-expense-date"
          label="Expense date"
          type="date"
          max={manilaToday()}
          value={draft.expense_date}
          disabled={pending}
          error={errors.expense_date}
          onChange={(event) => update({ expense_date: event.target.value })}
        />
        <ExpenseSelect
          id="edit-expense-location"
          label="Location"
          value={currentLocation}
          options={[
            { value: "", label: "Choose a location" },
            ...locationOptions,
          ]}
          disabled={pending || linked}
          error={errors.branch_id}
          onChange={(value) => setDraft(changeExpenseLocation(draft, value))}
        />
        <ExpenseSelect
          id="edit-expense-category"
          label="Category"
          value={draft.category_id}
          options={[
            { value: "", label: "Choose a category" },
            ...categoryOptions,
          ]}
          disabled={pending}
          error={errors.category_id}
          onChange={(value) => update({ category_id: value })}
        />
        <ExpenseField
          id="edit-expense-amount"
          label="Amount (PHP)"
          inputMode="decimal"
          value={draft.amount}
          disabled={pending || linked || Boolean(draft.cash_movement_id)}
          error={errors.amount}
          onChange={(event) => update({ amount: event.target.value })}
        />
        <div className="sm:col-span-2">
          <ExpenseField
            id="edit-expense-description"
            label="Description"
            value={draft.description}
            maxLength={160}
            disabled={pending}
            error={errors.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </div>
        <ExpenseSelect
          id="edit-expense-payment"
          label="Payment method"
          value={draft.payment_method}
          options={Object.entries(paymentLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          disabled={pending || linked}
          error={errors.payment_method}
          onChange={(value) =>
            setDraft(
              changeExpensePayment(
                draft,
                value as ExpenseInput["payment_method"],
              ),
            )
          }
        />
        {draft.payment_method === "CASH" && (
          <ExpenseSelect
            id="edit-expense-cash-source"
            label="Cash source"
            value={draft.cash_source ?? "OTHER"}
            options={[
              { value: "OTHER", label: "Other cash" },
              ...(draft.scope === "BRANCH" && (canReadShifts || linked)
                ? [{ value: "REGISTER", label: "Register cash out" }]
                : []),
            ]}
            disabled={pending || linked}
            error={errors.cash_source}
            onChange={(value) =>
              update({
                cash_source: value as "REGISTER" | "OTHER",
                cash_movement_id: null,
                amount: draft.cash_movement_id ? "" : draft.amount,
              })
            }
          />
        )}
      </div>
      {draft.cash_source === "REGISTER" && !linked && draft.branch_id && (
        <ExpenseCashOutPicker
          key={draft.branch_id}
          branch={draft.branch_id}
          selected={draft.cash_movement_id}
          selectedAmount={draft.amount}
          disabled={pending}
          onSelect={(item) =>
            update({
              cash_movement_id: item?.id ?? null,
              amount: item?.amount ?? "",
            })
          }
        />
      )}
      {errors.cash_movement_id && (
        <p role="alert" className="text-sm text-destructive">
          {errors.cash_movement_id}
        </p>
      )}
      {draft.payment_method === "CASH" && !canReadShifts && !linked && (
        <p className="text-xs text-muted-foreground">
          Register cash linking requires access to Shifts. Contact a manager if
          this expense was funded from the register.
        </p>
      )}
      <ExpenseSupportingFields
        draft={draft}
        update={update}
        errors={errors}
        pending={pending}
      />
    </>
  );
}
