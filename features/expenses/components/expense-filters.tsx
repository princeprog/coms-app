"use client";
import { Button } from "@/components/ui/button";
import type { ExpenseDirectory } from "../hooks/use-expense-page-clamp";
import type {
  ExpenseCategory,
  ExpenseLocation,
} from "../schemas/expense.schema";
import type { ExpenseQuery } from "../services/expense-query";
import { sourceLabels } from "../services/expense-format";
import { ExpenseField, ExpenseSelect } from "./expense-form-controls";

import { ExpenseDateFilter } from "./expense-date-filter";

export function ExpenseFilters({
  query,
  locations,
  categories,
  directory,
}: {
  query: ExpenseQuery;
  locations: ExpenseLocation[];
  categories: ExpenseCategory[];
  directory: ExpenseDirectory;
}) {
  const location = query.branch_id ?? query.scope ?? "all";
  const locationOptions = [
    { value: "all", label: "All permitted locations" },
    { value: "BRANCH", label: "All permitted branches" },
    ...locations.map((item) => ({
      value: item.branch_id ?? item.scope,
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
    })),
  ];
  const categoryOptions = [
    { value: "all", label: "All categories" },
    { value: "STOCK_PURCHASES", label: "Stock purchases" },
    ...categories.map((item) => ({
      value: item.id,
      label: `${item.name}${item.is_active ? "" : " (inactive)"}`,
    })),
  ];
  const chips = [
    ...(query.search
      ? [
          {
            label: `Search: ${query.search}`,
            clear: () => {
              directory.changeSearch("");
              directory.apply({ search: "" });
            },
          },
        ]
      : []),
    ...(query.scope || query.branch_id
      ? [
          {
            label: `Location: ${locationOptions.find((item) => item.value === location)?.label ?? "Selected location"}`,
            clear: () =>
              directory.apply({ scope: undefined, branch_id: undefined }),
          },
        ]
      : []),
    ...(query.category_id
      ? [
          {
            label: `Category: ${categoryOptions.find((item) => item.value === query.category_id)?.label ?? "Selected category"}`,
            clear: () => directory.apply({ category_id: undefined }),
          },
        ]
      : []),
    ...(query.source
      ? [
          {
            label: sourceLabels[query.source],
            clear: () => directory.apply({ source: undefined }),
          },
        ]
      : []),
    ...(query.status !== "RECORDED"
      ? [
          {
            label: query.status === "all" ? "All statuses" : "Voided",
            clear: () => directory.apply({ status: "RECORDED" }),
          },
        ]
      : []),
  ];
  return (
    <section
      aria-label="Expense filters"
      className="space-y-3"
      aria-busy={directory.pending}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <ExpenseField
            id="expense-search"
            label="Search expenses"
            placeholder="Description, payee or reference"
            value={directory.search}
            maxLength={160}
            onChange={(event) => directory.changeSearch(event.target.value)}
          />
        </div>
        <ExpenseSelect
          id="expense-sort"
          label="Sort by"
          value={query.sort}
          onChange={(sort) =>
            directory.apply({ sort: sort as ExpenseQuery["sort"] })
          }
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "amount_highest", label: "Highest amount" },
            { value: "amount_lowest", label: "Lowest amount" },
          ]}
        />
        <ExpenseSelect
          id="expense-status"
          label="Status"
          value={query.status}
          onChange={(status) =>
            directory.apply({ status: status as ExpenseQuery["status"] })
          }
          options={[
            { value: "RECORDED", label: "Recorded" },
            { value: "VOIDED", label: "Voided" },
            { value: "all", label: "All statuses" },
          ]}
        />
        <ExpenseSelect
          id="expense-location"
          label="Location"
          value={location}
          options={locationOptions}
          onChange={(value) =>
            directory.apply({
              scope:
                value === "all"
                  ? undefined
                  : value === "COMMISSARY"
                    ? "COMMISSARY"
                    : "BRANCH",
              branch_id: ["all", "COMMISSARY", "BRANCH"].includes(value)
                ? undefined
                : value,
            })
          }
        />
        <ExpenseSelect
          id="expense-category"
          label="Category"
          value={query.category_id ?? "all"}
          options={categoryOptions}
          onChange={(value) =>
            directory.apply({
              category_id: value === "all" ? undefined : value,
            })
          }
        />
        <ExpenseSelect
          id="expense-source"
          label="Source"
          value={query.source ?? "all"}
          options={[
            { value: "all", label: "All sources" },
            ...Object.entries(sourceLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) =>
            directory.apply({
              source:
                value === "all" ? undefined : (value as ExpenseQuery["source"]),
            })
          }
        />
      </div>
      <ExpenseDateFilter
        query={query}
        apply={(change) => {
          if (change.search !== undefined)
            directory.changeSearch(change.search);
          directory.apply(change);
        }}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Applied: {query.from} – {query.to}
        </span>
        {chips.map((chip) => (
          <Button
            key={chip.label}
            size="sm"
            variant="outline"
            onClick={chip.clear}
            aria-label={`Remove ${chip.label}`}
          >
            {chip.label} ×
          </Button>
        ))}
      </div>
    </section>
  );
}
