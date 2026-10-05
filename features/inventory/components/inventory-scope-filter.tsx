"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { InventoryBalanceFilterControls } from "./inventory-balance-filter-controls";
import { InventoryBranchSelect } from "./inventory-branch-select";
import { InventoryScopeToggle } from "./inventory-scope-toggle";
import { cn } from "@/lib/utils";
import { useInventoryFilters } from "../hooks/use-inventory-filters";
import type { InventoryScopeFilterProps } from "../types/inventory-filter.types";

export function InventoryScopeFilter(props: InventoryScopeFilterProps) {
  const {
    search,
    statusFilter,
    categoryFilter,
    branchOptions,
    availableCategories,
    scope,
    canViewCommissary,
    canViewBranch,
  } = props;
  const {
    draftSearch,
    locationValue,
    locationLabel,
    applyFilters,
    handleSearchChange,
    handleSearchKeyDown,
    handleLocationChange,
  } = useInventoryFilters(props);
  const chips = [
    ...(search
      ? [{ label: `Search: ${search}`, options: { nextSearch: "" } }]
      : []),
    ...(statusFilter
      ? [
          {
            label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
            options: { nextSearch: search, nextStatus: null },
          },
        ]
      : []),
    ...(categoryFilter
      ? [
          {
            label: `Category: ${categoryFilter}`,
            options: { nextSearch: search, nextCategory: null },
          },
        ]
      : []),
  ];
  return (
    <section
      aria-label="Inventory location and filters"
      className="flex min-w-0 flex-col gap-3"
    >
      <InventoryScopeToggle
        scope={scope}
        canViewCommissary={canViewCommissary}
        canViewBranch={canViewBranch}
        hasBranches={branchOptions.length > 0}
        onValueChange={(nextScope) =>
          handleLocationChange(
            nextScope === "COMMISSARY"
              ? "COMMISSARY"
              : `BRANCH:${props.selectedBranchId ?? branchOptions[0]?.id ?? ""}`,
          )
        }
      />
      <FieldGroup
        className={cn(
          "grid min-w-0 gap-3",
          scope === "BRANCH" && "md:grid-cols-3",
        )}
      >
        {scope === "BRANCH" && (
          <InventoryBranchSelect
            value={locationValue}
            label={locationLabel}
            branchOptions={branchOptions}
            onValueChange={handleLocationChange}
          />
        )}
        <Field className={cn("min-w-0", scope === "BRANCH" && "md:col-span-2")}>
          <FieldLabel htmlFor="inventory-search">Search stock items</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="inventory-search"
              type="search"
              maxLength={120}
              value={draftSearch}
              onChange={(event) => handleSearchChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by name or category..."
            />
          </InputGroup>
        </Field>
      </FieldGroup>
      <InventoryBalanceFilterControls
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        availableCategories={availableCategories}
        onStatusChange={(nextStatus) =>
          applyFilters({ nextStatus: nextStatus ?? null })
        }
        onCategoryChange={(nextCategory) =>
          applyFilters({ nextCategory: nextCategory ?? null })
        }
      />
      {chips.length > 0 && (
        <div
          aria-label="Active stock filters"
          className="flex flex-wrap items-center gap-2"
        >
          {chips.map((chip) => (
            <Button
              key={chip.label}
              variant="outline"
              size="sm"
              className="h-auto min-h-7 max-w-full whitespace-normal"
              aria-label={`Remove ${chip.label}`}
              onClick={() => {
                const fieldId = chip.label.startsWith("Status:")
                  ? "inventory-status"
                  : chip.label.startsWith("Category:")
                    ? "inventory-category"
                    : "inventory-search";
                document.getElementById(fieldId)?.focus();
                applyFilters(chip.options);
              }}
            >
              <span className="min-w-0 wrap-anywhere">{chip.label}</span>
              <X aria-hidden="true" data-icon="inline-end" />
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              document.getElementById("inventory-search")?.focus();
              applyFilters({
                nextSearch: "",
                nextStatus: null,
                nextCategory: null,
              });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Search updates as you type. Filters apply to stock balances.
      </p>
    </section>
  );
}
