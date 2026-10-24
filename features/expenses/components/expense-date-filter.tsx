"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExpenseField } from "./expense-form-controls";
import {
  defaultExpenseQuery,
  type ExpenseQuery,
} from "../services/expense-query";
export function ExpenseDateFilter({
  query,
  apply,
}: {
  query: ExpenseQuery;
  apply: (change: Partial<ExpenseQuery>) => void;
}) {
  const [dates, setDates] = useState({ from: query.from, to: query.to });
  const [dateError, setDateError] = useState("");
  return (
    <form
      className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        if (!dates.from || !dates.to || dates.from > dates.to) {
          setDateError("Choose a valid date range.");
          return;
        }
        setDateError("");
        apply(dates);
      }}
    >
      <div className="min-w-0 sm:max-w-48 sm:flex-1">
        <ExpenseField
          id="expense-from"
          label="From (Manila)"
          type="date"
          value={dates.from}
          onChange={(event) => setDates({ ...dates, from: event.target.value })}
        />
      </div>
      <div className="min-w-0 sm:max-w-48 sm:flex-1">
        <ExpenseField
          id="expense-to"
          label="To (Manila)"
          type="date"
          value={dates.to}
          error={dateError}
          onChange={(event) => setDates({ ...dates, to: event.target.value })}
        />
      </div>
      <Button variant="outline" type="submit">
        Apply dates
      </Button>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          const defaults = defaultExpenseQuery();
          setDates(defaults);
          apply({
            ...defaults,
            scope: undefined,
            branch_id: undefined,
            category_id: undefined,
            source: undefined,
          });
        }}
      >
        Reset filters
      </Button>
    </form>
  );
}
