"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { SetupBranch } from "../schemas/product-setup.schema";
import { useProductBranches } from "../hooks/use-product-branches";
import { getBranchAvailability } from "../product-branch-availability";
import { ProductBranchRow } from "./product-branch-row";
import { ProductBranchPagination } from "./product-branch-pagination";
import { ProductBranchSelected } from "./product-branch-selected";
import { ProductBranchToolbar } from "./product-branch-toolbar";

const nameMap = (items: SetupBranch[]) =>
  Object.fromEntries(items.map((branch) => [branch.id, branch.name]));

export function ProductBranchSelection({
  branches,
  total = branches.length,
  value,
  onChange,
  services,
  disabled,
  readOnly,
}: {
  branches: SetupBranch[];
  total?: number;
  value: string[];
  onChange: (ids: string[]) => void;
  services: ServiceType[];
  disabled: boolean;
  readOnly: boolean;
}) {
  const lookup = useProductBranches(branches, total, !readOnly);
  const [seen, setSeen] = useState<Record<string, string>>({});
  if (readOnly) {
    const selected = branches.filter((b) => value.includes(b.id));
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">Available branches</p>
        <p className="text-muted-foreground">
          {selected.length
            ? selected.map((b) => b.name).join(", ")
            : "Not available at your authorized branches."}
        </p>
      </div>
    );
  }
  const data = lookup.data;
  const items = data?.items ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const names = { ...nameMap(branches), ...seen, ...nameMap(items) };
  const eligible = items
    .filter((branch) => !getBranchAvailability(branch, services).reason)
    .map((branch) => branch.id);
  const pageSelected =
    eligible.length > 0 && eligible.every((id) => value.includes(id));
  const remember = (list: SetupBranch[]) =>
    setSeen((current) => ({ ...current, ...nameMap(list) }));
  return (
    <FieldSet className="min-w-0 gap-3">
      <FieldLegend className="mb-0 w-full">
        <span className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xl font-semibold">
            Available branches
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Optional
            </span>
          </span>
          <span
            role="status"
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
              value.length
                ? "bg-primary/10 text-primary dark:bg-orange-400/10 dark:text-orange-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {value.length} selected
          </span>
        </span>
      </FieldLegend>
      <FieldDescription>
        Select the branches that can sell this product.
      </FieldDescription>
      <ProductBranchToolbar
        search={lookup.search}
        onSearch={lookup.setSearch}
        disabled={disabled}
        multiplePages={pages > 1}
        pageSelected={pageSelected}
        canSelect={eligible.length > 0 && !lookup.isFetching}
        onTogglePage={() => {
          remember(items);
          onChange(
            pageSelected
              ? value.filter((id) => !eligible.includes(id))
              : [...new Set([...value, ...eligible])],
          );
        }}
      />
      <ProductBranchSelected
        ids={value}
        names={names}
        disabled={disabled}
        onRemove={(id) => onChange(value.filter((item) => item !== id))}
        onClear={() => onChange([])}
      />
      <div
        aria-label="Branch choices"
        aria-busy={lookup.isFetching}
        className={cn(
          "transition-opacity",
          lookup.isFetching && data && "opacity-60",
        )}
      >
        {lookup.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {lookup.error.message}
              <Button
                type="button"
                variant="link"
                onClick={() => void lookup.refetch()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : !data ? (
          <FieldGroup
            aria-label="Loading branches"
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <Skeleton key={card} className="h-16 w-full rounded-lg" />
            ))}
          </FieldGroup>
        ) : items.length ? (
          <FieldGroup className="grid max-h-96 gap-2 overflow-y-auto p-0.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((branch) => (
              <ProductBranchRow
                key={branch.id}
                branch={branch}
                checked={value.includes(branch.id)}
                services={services}
                disabled={disabled}
                onChange={(checked) => {
                  remember([branch]);
                  onChange(
                    checked
                      ? [...new Set([...value, branch.id])]
                      : value.filter((id) => id !== branch.id),
                  );
                }}
              />
            ))}
          </FieldGroup>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>
                {lookup.search
                  ? "No branches match your search."
                  : "No branches yet."}
              </EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              {lookup.search ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => lookup.setSearch("")}
                >
                  Clear search
                </Button>
              ) : (
                <Link className="underline" href="/branches">
                  Create a branch
                </Link>
              )}
            </EmptyContent>
          </Empty>
        )}
      </div>
      {pages > 1 && (
        <ProductBranchPagination
          page={lookup.page}
          pages={pages}
          total={data?.total ?? 0}
          disabled={disabled || lookup.isFetching}
          onPage={lookup.setPage}
        />
      )}
    </FieldSet>
  );
}
