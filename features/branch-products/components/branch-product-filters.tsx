"use client";

import { useState } from "react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchProductsRoute } from "@/features/branch-products/constants";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type { BranchProductPageFilters } from "@/features/branch-products/services/branch-product-page-params";

function branchLabel(
  branchOptions: BranchProductBranchOption[],
  branchId: unknown,
) {
  const branch = branchOptions.find((option) => option.id === branchId);
  if (!branch) return "Choose a branch";
  return `${branch.name}${branch.status === "inactive" ? " (inactive)" : ""}`;
}

export function BranchProductFilters({
  branchOptions,
  selectedBranchId,
  filters,
}: {
  branchOptions: BranchProductBranchOption[];
  selectedBranchId?: string;
  filters: BranchProductPageFilters;
}) {
  const [branchChoice, setBranchChoice] = useState(selectedBranchId ?? "");
  const [availabilityChoice, setAvailabilityChoice] = useState(
    filters.isAvailable === undefined ? "all" : String(filters.isAvailable),
  );

  return (
    <Form
      action={branchProductsRoute}
      aria-label="Filter branch products"
      className="rounded-lg border bg-card p-4"
    >
      <FieldGroup className="gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-[minmax(12rem,0.8fr)_minmax(12rem,1fr)_minmax(12rem,0.7fr)_auto] xl:items-end">
        <Field className="min-w-0">
          <FieldLabel htmlFor="branch-product-branch">Branch</FieldLabel>
          <Select
            value={branchChoice || null}
            onValueChange={(value) => setBranchChoice(value ?? "")}
          >
            <SelectTrigger id="branch-product-branch" className="w-full">
              <SelectValue>
                {(value: unknown) => branchLabel(branchOptions, value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.status === "inactive" ? " (inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="branch_id" value={branchChoice} />
        </Field>

        <Field className="min-w-0">
          <FieldLabel htmlFor="branch-product-search">
            Search products
          </FieldLabel>
          <Input
            id="branch-product-search"
            name="search"
            maxLength={100}
            defaultValue={filters.search}
            placeholder="Product name"
          />
        </Field>

        <Field className="min-w-0">
          <FieldLabel htmlFor="branch-product-availability">
            Availability
          </FieldLabel>
          <Select
            value={availabilityChoice}
            onValueChange={(value) => setAvailabilityChoice(value ?? "all")}
          >
            <SelectTrigger id="branch-product-availability" className="w-full">
              <SelectValue>
                {(value: unknown) =>
                  value === "true"
                    ? "Available"
                    : value === "false"
                      ? "Not available"
                      : "All offers"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              <SelectItem value="all">All offers</SelectItem>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Not available</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="hidden"
            name="is_available"
            value={availabilityChoice === "all" ? "" : availabilityChoice}
          />
        </Field>

        <Button type="submit" variant="outline" className="w-fit">
          Apply filters
        </Button>
      </FieldGroup>
    </Form>
  );
}
