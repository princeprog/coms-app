"use client";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_CATEGORIES = "__all_categories__";
const CATEGORY_VALUE_PREFIX = "CATEGORY:";

export function InventoryBalanceFilterControls({
  statusFilter,
  categoryFilter,
  availableCategories,
  onStatusChange,
  onCategoryChange,
}: {
  statusFilter?: "active" | "inactive";
  categoryFilter?: string;
  availableCategories: string[];
  onStatusChange: (value: "active" | "inactive" | undefined) => void;
  onCategoryChange: (value: string | undefined) => void;
}) {
  const statusLabel =
    statusFilter === "active"
      ? "Active"
      : statusFilter === "inactive"
        ? "Inactive"
        : "All statuses";

  return (
    <FieldGroup className="grid min-w-0 gap-3 sm:max-w-lg sm:grid-cols-2">
      <Field className="min-w-0">
        <FieldLabel htmlFor="inventory-status">Status</FieldLabel>
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(value) =>
            onStatusChange(
              value === "active" || value === "inactive" ? value : undefined,
            )
          }
        >
          <SelectTrigger
            id="inventory-status"
            aria-label="Status"
            className="w-full"
          >
            <SelectValue>{statusLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            alignItemWithTrigger={false}
            data-coms-ui="operational"
          >
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field className="min-w-0">
        <FieldLabel htmlFor="inventory-category">Category</FieldLabel>
        <Select
          value={
            categoryFilter
              ? `${CATEGORY_VALUE_PREFIX}${categoryFilter}`
              : ALL_CATEGORIES
          }
          onValueChange={(value) =>
            onCategoryChange(
              value === ALL_CATEGORIES
                ? undefined
                : value?.startsWith(CATEGORY_VALUE_PREFIX)
                  ? value.slice(CATEGORY_VALUE_PREFIX.length)
                  : undefined,
            )
          }
        >
          <SelectTrigger
            id="inventory-category"
            aria-label="Category"
            className="w-full"
          >
            <SelectValue>{categoryFilter ?? "All categories"}</SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            alignItemWithTrigger={false}
            data-coms-ui="operational"
          >
            <SelectGroup>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem
                  key={category}
                  value={`${CATEGORY_VALUE_PREFIX}${category}`}
                >
                  {category}
                </SelectItem>
              ))}
              {categoryFilter &&
                !availableCategories.includes(categoryFilter) && (
                  <SelectItem
                    value={`${CATEGORY_VALUE_PREFIX}${categoryFilter}`}
                  >
                    {categoryFilter} (unavailable)
                  </SelectItem>
                )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
