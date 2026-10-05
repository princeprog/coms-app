"use client";

import { useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createCatalogHref,
  type CatalogDirectoryFilters,
} from "../services/catalog-page-params";

export function CatalogDirectoryFilter({
  title,
  resourceName,
  routePath,
  filters,
  onPendingChange,
}: {
  title: string;
  resourceName: string;
  routePath: string;
  filters: CatalogDirectoryFilters;
  onPendingChange: (pending: boolean) => void;
}) {
  const { search, changeSearch, flushSearch, apply, pending } =
    useDirectoryQuery(filters, (next) => createCatalogHref(routePath, next));
  const prefix = resourceName.replaceAll(" ", "-");
  const hasFilters = Boolean(filters.search) || filters.active !== "all";
  useEffect(() => onPendingChange(pending), [pending, onPendingChange]);
  function clear(change: Partial<CatalogDirectoryFilters>, field: string) {
    document.getElementById(`${prefix}-${field}`)?.focus();
    apply(change);
  }
  return (
    <form
      aria-label={`Filter ${title.toLowerCase()}`}
      className="flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        flushSearch();
      }}
    >
      <FieldGroup className="gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 sm:flex-1">
          <FieldLabel htmlFor={`${prefix}-search`}>
            Search {title.toLowerCase()}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${prefix}-search`}
              type="search"
              maxLength={160}
              value={search}
              placeholder={
                resourceName === "supplier"
                  ? "Search by supplier name..."
                  : "Search by stock item name..."
              }
              onChange={(event) => changeSearch(event.target.value)}
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <DirectorySelect
          id={`${prefix}-status`}
          label="Status"
          value={filters.active}
          options={[
            { value: "all", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
          onChange={(value) =>
            apply({ active: value as CatalogDirectoryFilters["active"] })
          }
        />
      </FieldGroup>
      {hasFilters && (
        <div
          aria-label="Active filters"
          className="flex flex-wrap items-center gap-2"
        >
          {filters.search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto min-h-7 max-w-full whitespace-normal"
              aria-label={`Remove search: ${filters.search}`}
              onClick={() => clear({ search: "" }, "search")}
            >
              <span className="min-w-0 wrap-anywhere">
                Search: {filters.search}
              </span>
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          )}
          {filters.active !== "all" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Remove status: ${filters.active === "true" ? "Active" : "Inactive"}`}
              onClick={() =>
                clear({ active: "all", search: filters.search }, "status")
              }
            >
              Status: {filters.active === "true" ? "Active" : "Inactive"}
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => clear({ search: "", active: "all" }, "search")}
          >
            Clear all
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Search updates as you type. Status filters apply immediately.
      </p>
    </form>
  );
}
