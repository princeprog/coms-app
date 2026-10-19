"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { CategoryPagination } from "./category-pagination";
import type { CatalogDirectoryFilters } from "@/features/catalogs/services/catalog-page-params";
import type {
  ProductCategory,
  ProductCategoryPage,
} from "../schemas/product-category.schema";
import { CategoryFilters } from "./category-filters";
import { CategoryEditor } from "./category-editor";
import { CategoryRowActions } from "./category-row-actions";

export function CategoryManagement({
  page,
  filters,
}: {
  page: ProductCategoryPage;
  filters: CatalogDirectoryFilters;
}) {
  const [editor, setEditor] = useState<{
    record: ProductCategory | null;
  } | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-6" data-coms-ui="operational">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Link
            href="/products"
            className="flex w-fit items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Products
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product categories
          </h1>
        </div>
        <Button onClick={() => setEditor({ record: null })}>
          <Plus aria-hidden="true" />
          Create category
        </Button>
      </header>
      <CategoryFilters filters={filters} />
      <section
        aria-label="Product categories"
        className="min-w-0 overflow-hidden rounded-xl border bg-card"
      >
        {page.items.length ? (
          <Table>
            <TableCaption className="sr-only">Product categories</TableCaption>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="px-4">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="max-w-sm px-4 font-medium whitespace-normal wrap-anywhere">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        category.is_active
                          ? "bg-emerald-700 text-white"
                          : "bg-red-700 text-white"
                      }
                    >
                      {category.is_active ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CategoryRowActions
                      category={category}
                      onEdit={() => setEditor({ record: category })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="font-medium">
              {filters.search || filters.active !== "all"
                ? "No matching categories"
                : "No categories yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filters.search || filters.active !== "all"
                ? "Try changing or clearing your filters."
                : "Create a category to organize your products."}
            </p>
          </div>
        )}
        <div className="border-t px-4 py-3">
          <CategoryPagination page={page} filters={filters} />
        </div>
      </section>
      {editor && (
        <CategoryEditor
          key={editor.record?.id ?? "new"}
          record={editor.record}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
