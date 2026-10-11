"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyContent,
} from "@/components/ui/empty";
import type { SetupBranch } from "../schemas/product-setup.schema";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import { useProductBranches } from "../hooks/use-product-branches";
import { ProductBranchRow } from "./product-branch-row";
import { ProductBranchPagination } from "./product-branch-pagination";

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
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <FieldSet className="gap-3">
      <FieldLegend className="mb-0 w-full">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-xl font-semibold">Available branches</span>
          <span
            className="text-sm font-normal text-muted-foreground"
            role="status"
          >
            {value.length} selected
          </span>
        </span>
      </FieldLegend>
      <FieldDescription>
        Select the branches that can sell this product.
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor="product-branch-search" className="sr-only">
          Search branches
        </FieldLabel>
        <InputGroup className="h-10">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="product-branch-search"
            value={lookup.search}
            onChange={(event) => lookup.setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Search branches..."
            maxLength={100}
            disabled={disabled}
          />
        </InputGroup>
      </Field>
      <div aria-label="Branch choices" aria-busy={lookup.isFetching}>
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
            className="gap-3 rounded-lg border p-4"
          >
            {[1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </FieldGroup>
        ) : data.items.length ? (
          <FieldGroup className="max-h-64 gap-0 divide-y overflow-y-auto rounded-lg border">
            {data.items.map((branch) => (
              <ProductBranchRow
                key={branch.id}
                branch={branch}
                checked={value.includes(branch.id)}
                services={services}
                disabled={disabled}
                onChange={(checked) =>
                  onChange(
                    checked
                      ? [...new Set([...value, branch.id])]
                      : value.filter((id) => id !== branch.id),
                  )
                }
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
      <FieldDescription>
        You can choose branches now or add them later.
      </FieldDescription>
    </FieldSet>
  );
}
