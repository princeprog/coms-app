"use client";
import { CircleCheck, Archive, ListFilter, Search } from "lucide-react";
import { DirectorySelect } from "@/components/shared/directory-select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createCatalogHref,
  type CatalogDirectoryFilters,
} from "@/features/catalogs/services/catalog-page-params";

const options = [
  {
    value: "all",
    label: "All statuses",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "true",
    label: "Active",
    icon: <CircleCheck className="text-emerald-600! dark:text-emerald-400!" />,
  },
  {
    value: "false",
    label: "Archived",
    icon: <Archive className="text-red-600! dark:text-red-400!" />,
  },
];
export function CategoryFilters({
  filters,
}: {
  filters: CatalogDirectoryFilters;
}) {
  const query = useDirectoryQuery(filters, (next) =>
    createCatalogHref("/products/categories", next),
  );
  return (
    <form
      className="flex flex-col gap-3 [&_[data-slot=select-trigger]]:h-10"
      onSubmit={(event) => {
        event.preventDefault();
        query.flushSearch();
      }}
      aria-label="Filter categories"
      aria-busy={query.pending}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="category-search">Search categories</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupInput
              id="category-search"
              type="search"
              placeholder="Search by category name..."
              value={query.search}
              maxLength={80}
              onChange={(event) => query.changeSearch(event.target.value)}
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <DirectorySelect
          id="category-status"
          label="Status"
          value={filters.active}
          options={options}
          alignItemWithTrigger={false}
          onChange={(value) =>
            query.apply({ active: value as CatalogDirectoryFilters["active"] })
          }
        />
      </div>
      {(filters.search || filters.active !== "all") && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {filters.search && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                query.changeSearch("");
                query.apply({ search: "" });
              }}
            >
              Remove search: {filters.search}
            </Button>
          )}
          {filters.active !== "all" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => query.apply({ active: "all" })}
            >
              Remove status: {filters.active === "true" ? "Active" : "Archived"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              query.changeSearch("");
              query.apply({ search: "", active: "all" });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      {query.pending && (
        <p role="status" className="text-sm text-muted-foreground">
          Updating categories…
        </p>
      )}
    </form>
  );
}
