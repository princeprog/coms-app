"use client";
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableCategories } from "../hooks/use-available-categories";
import type { CategoryChoice } from "../schemas/product-category.schema";

export function ProductCategorySelector({
  value,
  onChange,
  disabled,
  error,
}: {
  value: CategoryChoice | null;
  onChange: (category: CategoryChoice) => void;
  disabled: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const query = useAvailableCategories(open);
  const busy = query.isFetching || query.searching;
  const items =
    query.data?.items.filter((category) => category.is_active) ?? [];
  const message =
    error ||
    (value && !value.is_active
      ? "Choose an active category before saving."
      : undefined);
  return (
    <Field data-invalid={Boolean(message)}>
      <FieldLabel htmlFor="product-category">
        Category{" "}
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id="product-category"
              type="button"
              role="combobox"
              variant="outline"
              disabled={disabled}
              aria-required="true"
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "product-category-error" : undefined}
              className="h-10 w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            {value
              ? `${value.name}${value.is_active ? "" : " (Archived)"}`
              : "Select a category"}
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--anchor-width) max-w-(--available-width) p-0"
          aria-label="Choose a category"
          data-coms-ui="operational"
        >
          <Command shouldFilter={false} label="Search categories">
            <CommandInput
              aria-label="Search categories"
              placeholder="Search categories..."
              maxLength={80}
              value={query.search}
              onValueChange={query.setSearch}
            />
            <CommandList label="Active categories" aria-busy={busy}>
              {busy ? (
                <div
                  role="status"
                  aria-label="Loading categories"
                  className="space-y-2 p-3"
                >
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </div>
              ) : query.isError ? (
                <div className="p-3">
                  <p role="alert">{query.error.message}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => void query.refetch()}
                  >
                    Retry categories
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <p role="status" className="p-3 text-muted-foreground">
                  {query.search
                    ? "No matching categories."
                    : "No active categories available."}
                </p>
              ) : (
                items.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    data-checked={category.id === value?.id}
                    onSelect={() => {
                      onChange(category);
                      setOpen(false);
                    }}
                  >
                    {category.name}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
          {query.data && !query.isError && (
            <div className="flex items-center justify-between gap-2 border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || query.page <= 1}
                onClick={() => query.setPage(query.page - 1)}
              >
                Previous categories
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {query.page}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  busy || query.page * query.data.page_size >= query.data.total
                }
                onClick={() => query.setPage(query.page + 1)}
              >
                Next categories
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {message && (
        <FieldError id="product-category-error">{message}</FieldError>
      )}
    </Field>
  );
}
