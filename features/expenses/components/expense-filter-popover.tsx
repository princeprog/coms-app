"use client";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ExpenseQuery } from "../services/expense-query";
import {
  expenseLocationChange,
  expenseLocationValue,
  expenseSourceOptions,
  expenseStatusOptions,
  type ExpenseFilterOption,
} from "./expense-filter-options";

type FilterDraft = Pick<
  ExpenseQuery,
  "status" | "scope" | "branch_id" | "category_id" | "source"
>;
const cleared: FilterDraft = {
  status: "RECORDED",
  scope: undefined,
  branch_id: undefined,
  category_id: undefined,
  source: undefined,
};

export function activeExpenseFilterCount(query: ExpenseQuery) {
  return [
    query.status !== "RECORDED",
    Boolean(query.scope || query.branch_id),
    Boolean(query.category_id),
    Boolean(query.source),
  ].filter(Boolean).length;
}

const selectClass =
  "sm:w-full [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:px-3";

export function ExpenseFilterPopover({
  query,
  showLocation,
  locationOptions,
  categoryOptions,
  onApply,
}: {
  query: ExpenseQuery;
  showLocation: boolean;
  locationOptions: ExpenseFilterOption[];
  categoryOptions: ExpenseFilterOption[];
  onApply: (change: FilterDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(cleared);
  const count = activeExpenseFilterCount(query);
  function apply(change: FilterDraft) {
    onApply(change);
    setOpen(false);
  }
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next)
          setDraft({
            status: query.status,
            scope: query.scope,
            branch_id: query.branch_id,
            category_id: query.category_id,
            source: query.source,
          });
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-11 px-3"
            aria-label={count ? `Filters, ${count} active` : "Filters"}
          />
        }
      >
        <SlidersHorizontal aria-hidden="true" className="text-primary" />
        Filters
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        data-coms-ui="operational"
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))] gap-3 p-4"
      >
        <p className="text-sm font-medium">Filter expenses</p>
        <DirectorySelect
          id="expense-status"
          label="Status"
          value={draft.status}
          options={expenseStatusOptions}
          alignItemWithTrigger={false}
          className={selectClass}
          onChange={(status) =>
            setDraft({ ...draft, status: status as ExpenseQuery["status"] })
          }
        />
        {showLocation && (
          <DirectorySelect
            id="expense-location"
            label="Location"
            value={expenseLocationValue(draft)}
            options={locationOptions}
            alignItemWithTrigger={false}
            className={selectClass}
            onChange={(value) =>
              setDraft({ ...draft, ...expenseLocationChange(value) })
            }
          />
        )}
        <DirectorySelect
          id="expense-category"
          label="Category"
          value={draft.category_id ?? "all"}
          options={categoryOptions}
          alignItemWithTrigger={false}
          className={selectClass}
          onChange={(value) =>
            setDraft({
              ...draft,
              category_id: value === "all" ? undefined : value,
            })
          }
        />
        <DirectorySelect
          id="expense-source"
          label="Source"
          value={draft.source ?? "all"}
          options={expenseSourceOptions}
          alignItemWithTrigger={false}
          className={selectClass}
          onChange={(value) =>
            setDraft({
              ...draft,
              source:
                value === "all" ? undefined : (value as ExpenseQuery["source"]),
            })
          }
        />
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="ghost" onClick={() => apply(cleared)}>
            Reset
          </Button>
          <Button type="button" onClick={() => apply(draft)}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
