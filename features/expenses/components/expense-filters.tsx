"use client";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { ExpenseDirectory } from "../hooks/use-expense-page-clamp";
import type {
  ExpenseCategory,
  ExpenseLocation,
} from "../schemas/expense.schema";
import type { ExpenseQuery } from "../services/expense-query";
import { ExpenseDateFilter } from "./expense-date-filter";
import {
  expenseCategoryOptions,
  expenseLocationOptions,
  expenseLocationValue,
  expenseSortOptions,
  expenseSourceOptions,
  expenseStatusOptions,
} from "./expense-filter-options";
import { ExpenseFilterPopover } from "./expense-filter-popover";

type Chip = { label: string; clear: () => void };
const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label;

export function ExpenseFilters({
  query,
  locations,
  categories,
  directory,
  showLocation = true,
}: {
  query: ExpenseQuery;
  locations: ExpenseLocation[];
  categories: ExpenseCategory[];
  directory: ExpenseDirectory;
  showLocation?: boolean;
}) {
  const locationOptions = expenseLocationOptions(locations);
  const categoryOptions = expenseCategoryOptions(categories);
  const chips = [
    query.search && {
      label: `Search: ${query.search}`,
      clear: () => {
        directory.changeSearch("");
        directory.apply({ search: "" });
      },
    },
    query.status !== "RECORDED" && {
      label: `Status: ${labelOf(expenseStatusOptions, query.status)}`,
      clear: () => directory.apply({ status: "RECORDED" }),
    },
    (query.scope || query.branch_id) && {
      label: `Location: ${labelOf(locationOptions, expenseLocationValue(query)) ?? "Selected location"}`,
      clear: () => directory.apply({ scope: undefined, branch_id: undefined }),
    },
    query.category_id && {
      label: `Category: ${labelOf(categoryOptions, query.category_id) ?? "Selected category"}`,
      clear: () => directory.apply({ category_id: undefined }),
    },
    query.source && {
      label: `Source: ${labelOf(expenseSourceOptions, query.source)}`,
      clear: () => directory.apply({ source: undefined }),
    },
  ].filter((chip): chip is Chip => Boolean(chip));
  return (
    <section
      aria-label="Expense filters"
      className="flex flex-col gap-3"
      aria-busy={directory.pending}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <InputGroup className="h-11 min-w-0 lg:flex-1">
          <InputGroupInput
            id="expense-search"
            type="search"
            aria-label="Search expenses"
            className="h-full text-base md:text-sm"
            placeholder="Search description, payee or reference…"
            value={directory.search}
            maxLength={160}
            onChange={(event) => directory.changeSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                directory.flushSearch();
              }
            }}
          />
          <InputGroupAddon className="pl-3">
            <Search aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <DirectorySelect
            id="expense-sort"
            label="Sort by"
            hideLabel
            value={query.sort}
            options={expenseSortOptions}
            alignItemWithTrigger={false}
            className="sm:w-48 [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3"
            onChange={(sort) =>
              directory.apply({ sort: sort as ExpenseQuery["sort"] })
            }
          />
          <ExpenseFilterPopover
            query={query}
            showLocation={showLocation}
            locationOptions={locationOptions}
            categoryOptions={categoryOptions}
            onApply={(change) => directory.apply(change)}
          />
          <div className="col-span-2 sm:col-span-1">
            <ExpenseDateFilter
              query={query}
              apply={(change) => directory.apply(change)}
            />
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Active expense filters"
        >
          {chips.map((chip) => (
            <Button
              key={chip.label}
              type="button"
              size="sm"
              variant="outline"
              className="h-auto max-w-full whitespace-normal text-left"
              onClick={chip.clear}
              aria-label={`Remove ${chip.label}`}
            >
              <span className="min-w-0 break-words">{chip.label}</span>
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              directory.changeSearch("");
              directory.apply({
                search: "",
                status: "RECORDED",
                scope: undefined,
                branch_id: undefined,
                category_id: undefined,
                source: undefined,
              });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <span
        role="status"
        className={
          directory.pending ? "text-xs text-muted-foreground" : "sr-only"
        }
      >
        {directory.pending ? "Updating expenses…" : ""}
      </span>
    </section>
  );
}
