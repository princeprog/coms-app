"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { useDirectoryQuery } from "@/hooks/use-directory-query";
import type { BranchMenuCategory } from "@/features/branch-products/schemas/branch-product.schema";
import { type SalesPageFilters } from "../services/sales-page-params";

export function PosMenuControls({
  filters,
  categories,
  categoriesUnavailable,
  query,
}: {
  filters: SalesPageFilters;
  categories: BranchMenuCategory[];
  categoriesUnavailable: boolean;
  query: ReturnType<typeof useDirectoryQuery<SalesPageFilters>>;
}) {
  const router = useRouter();
  const filtered = Boolean(filters.search || filters.categoryId);
  return (
    <section
      aria-label="Filter products"
      className="flex min-w-0 flex-col gap-3"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          query.flushSearch();
        }}
      >
        <Field>
          <FieldLabel htmlFor="pos-product-search">Search products</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon className="pl-3">
              {query.pending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Search aria-hidden="true" />
              )}
            </InputGroupAddon>
            <InputGroupInput
              id="pos-product-search"
              type="search"
              maxLength={100}
              placeholder="Find a product…"
              value={query.search}
              onChange={(event) => query.changeSearch(event.target.value)}
            />
          </InputGroup>
        </Field>
      </form>
      <div
        role="group"
        aria-label="Product categories"
        className="flex min-w-0 gap-2 overflow-x-auto py-1"
      >
        <Button
          type="button"
          variant={!filters.categoryId ? "default" : "outline"}
          className="h-10 shrink-0 rounded-full px-4"
          aria-pressed={!filters.categoryId}
          onClick={() => query.apply({ categoryId: undefined })}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            type="button"
            variant={filters.categoryId === category.id ? "default" : "outline"}
            className="h-10 shrink-0 rounded-full px-4"
            aria-pressed={filters.categoryId === category.id}
            onClick={() => query.apply({ categoryId: category.id })}
          >
            {category.name}
          </Button>
        ))}
      </div>
      {categoriesUnavailable && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <p role="alert" className="text-muted-foreground">
            Categories couldn’t be loaded.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            Retry categories
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {filtered && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => {
              query.changeSearch("");
              query.apply({ search: "", categoryId: undefined });
              document.getElementById("pos-product-search")?.focus();
            }}
          >
            <X aria-hidden="true" />
            Clear filters
          </Button>
        )}
        <span
          role="status"
          className={
            query.pending ? "text-xs text-muted-foreground" : "sr-only"
          }
        >
          {query.pending ? "Updating products…" : "Products updated."}
        </span>
      </div>
    </section>
  );
}
