"use client";

import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";
import type { InventoryBranchOption } from "@/features/inventory/types/inventory.types";

export function InventoryScopeFilter({
  scope,
  branchOptions,
  selectedBranchId,
  search,
}: {
  scope: "COMMISSARY" | "BRANCH";
  branchOptions: InventoryBranchOption[];
  selectedBranchId?: string;
  search: string;
}) {
  const firstBranchId = selectedBranchId ?? branchOptions[0]?.id ?? "";
  const [branchChoice, setBranchChoice] = useState(firstBranchId);

  return (
    <section
      aria-label="Inventory scope and filters"
      className="flex flex-col gap-4 rounded-lg border bg-card p-4"
    >
      <nav aria-label="Inventory scope" className="flex flex-wrap gap-2">
        <Link
          className={buttonVariants({
            variant: scope === "COMMISSARY" ? "default" : "outline",
            className: "rounded-md",
          })}
          href={createInventoryHref({
            scope: "COMMISSARY",
            page: 1,
            search,
          })}
          aria-label="Commissary inventory"
          aria-current={scope === "COMMISSARY" ? "page" : undefined}
        >
          Commissary
        </Link>
        <Link
          className={buttonVariants({
            variant: scope === "BRANCH" ? "default" : "outline",
            className: "rounded-md",
          })}
          href={createInventoryHref({
            scope: "BRANCH",
            branchId: firstBranchId || undefined,
            page: 1,
            search,
          })}
          aria-label="Branch inventory"
          aria-current={scope === "BRANCH" ? "page" : undefined}
        >
          Branch
        </Link>
      </nav>

      <Form
        action="/inventory"
        className={
          scope === "BRANCH"
            ? "grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto]"
            : "grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end"
        }
        aria-label="Filter inventory"
      >
        <input type="hidden" name="scope" value={scope} />
        <Field className="min-w-0">
          <FieldLabel htmlFor="inventory-search">Search stock items</FieldLabel>
          <Input
            key={`${scope}-${search}`}
            id="inventory-search"
            name="search"
            type="search"
            maxLength={120}
            defaultValue={search}
            placeholder="Item name or category"
          />
        </Field>
        {scope === "BRANCH" && (
          <Field className="min-w-0">
            <FieldLabel htmlFor="inventory-branch">Branch</FieldLabel>
            {branchOptions.length > 0 ? (
              <>
                <Select
                  value={branchChoice}
                  onValueChange={(value) => setBranchChoice(value ?? "")}
                >
                  <SelectTrigger id="inventory-branch" className="w-full">
                    <SelectValue>
                      {(value: unknown) => {
                        const branch = branchOptions.find(
                          (option) => option.id === value,
                        );
                        if (!branch) return "Select a branch";
                        return branch.status === "inactive"
                          ? branch.name + " (inactive)"
                          : branch.name;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent data-coms-ui="operational">
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.status === "inactive"
                          ? `${branch.name} (inactive)`
                          : branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="branch_id" value={branchChoice} />
              </>
            ) : (
              <p className="flex h-9 items-center text-sm text-muted-foreground">
                No branch is available to this account.
              </p>
            )}
          </Field>
        )}
        <Button type="submit" variant="outline" className="w-fit">
          Apply filters
        </Button>
      </Form>
    </section>
  );
}
