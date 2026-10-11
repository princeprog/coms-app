"use client";
import { LoaderCircle, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { cn } from "@/lib/utils";
import {
  MenuListContext,
  type MenuListContextValue,
} from "./menu-list-context";
type Filter = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};
export function MenuListControls({
  route,
  search,
  filters = [],
  preserveKeys = [],
  searchPlaceholder = "Search products…",
  searchLabel = "Search",
  comfortable = false,
  context,
}: {
  route: string;
  search: string;
  filters?: Filter[];
  preserveKeys?: string[];
  comfortable?: boolean;
  searchPlaceholder?: string;
  searchLabel?: string;
  context?: MenuListContextValue;
}) {
  const params = useSearchParams();
  const applied: Record<string, string | number> & {
    page: number;
    search: string;
  } = { page: 1, search };
  for (const key of preserveKeys) applied[key] = params.get(key) ?? "";
  if (params.get("branch_id")) applied.branch_id = params.get("branch_id")!;
  if (context) applied[context.key] = context.value;
  for (const filter of filters) applied[filter.key] = filter.value;
  const query = useDirectoryQuery(applied, (next) => {
    const values = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (key !== "page" && value !== "") values.set(key, String(value));
    }
    return values.size ? `${route}?${values}` : route;
  });
  const active = filters.filter(
    (filter) => filter.value && !["branch_id", "sort"].includes(filter.key),
  );
  return (
    <form
      className={cn("flex min-w-0 flex-col gap-3", comfortable && "gap-5")}
      aria-label="Filter menu items"
      aria-busy={query.pending}
      onSubmit={(event) => {
        event.preventDefault();
        query.flushSearch();
      }}
    >
      {context && (
        <MenuListContext
          context={context}
          id={`${route}-${context.key}`}
          onChange={(value) => query.apply({ [context.key]: value })}
        />
      )}
      <FieldGroup
        className={cn(
          "gap-3 xl:flex-row xl:items-end",
          comfortable &&
            "grid gap-4 sm:grid-cols-2 xl:grid-cols-5 [&_[data-slot=field]]:w-full [&_[data-slot=input-group]]:h-10 [&_[data-slot=select-trigger]]:h-10",
        )}
      >
        <Field className={cn("min-w-0 flex-1", comfortable && "sm:col-span-2")}>
          <FieldLabel htmlFor={`${route}-search`}>{searchLabel}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${route}-search`}
              type="search"
              value={query.search}
              maxLength={160}
              placeholder={searchPlaceholder}
              onChange={(event) => query.changeSearch(event.target.value)}
            />
            <InputGroupAddon>
              {query.pending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Search aria-hidden="true" />
              )}
            </InputGroupAddon>
          </InputGroup>
        </Field>
        {filters.map((filter) => (
          <DirectorySelect
            key={filter.key}
            id={`${route}-${filter.key}`}
            label={filter.label}
            value={filter.value || "all"}
            options={filter.options.map((option) => ({
              ...option,
              value: option.value || "all",
            }))}
            onChange={(value) =>
              query.apply({ [filter.key]: value === "all" ? "" : value })
            }
          />
        ))}
      </FieldGroup>
      {(search || active.length > 0) && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                query.changeSearch("");
                query.apply({ search: "" });
              }}
            >
              Search: {search}
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          )}
          {active.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Remove ${filter.label.toLowerCase()} filter`}
              onClick={() => query.apply({ [filter.key]: "" })}
            >
              {filter.label}:{" "}
              {
                filter.options.find((option) => option.value === filter.value)
                  ?.label
              }
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              query.changeSearch("");
              query.apply(
                Object.fromEntries([
                  ["search", ""],
                  ...active.map((filter) => [filter.key, ""]),
                ]),
              );
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <p
        className={comfortable ? "sr-only" : "text-xs text-muted-foreground"}
        role="status"
      >
        {query.pending
          ? "Updating results…"
          : filters.length
            ? "Search updates as you type. Filters and sorting apply immediately."
            : "Search updates as you type."}
      </p>
    </form>
  );
}
