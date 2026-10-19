"use client";

import { CircleCheck, CircleX, ListFilter, Tags, Tag } from "lucide-react";
import { DirectorySelect } from "@/components/shared/directory-select";
import { FieldGroup } from "@/components/ui/field";

const ALL_CATEGORIES = "__all_categories__";
const CATEGORY_VALUE_PREFIX = "CATEGORY:";
const statusOptions = [
  {
    value: "all",
    label: "All statuses",
    icon: <ListFilter className="text-primary!" />,
  },
  {
    value: "active",
    label: "Active",
    icon: <CircleCheck className="text-emerald-600! dark:text-emerald-400!" />,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: <CircleX className="text-red-600! dark:text-red-400!" />,
  },
];
const controlClassName =
  "sm:w-full [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:px-3";

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
  const categories =
    categoryFilter && !availableCategories.includes(categoryFilter)
      ? [...availableCategories, categoryFilter]
      : availableCategories;
  const categoryOptions = [
    {
      value: ALL_CATEGORIES,
      label: "All categories",
      icon: <Tags className="text-violet-600! dark:text-violet-400!" />,
    },
    ...categories.map((category) => ({
      value: `${CATEGORY_VALUE_PREFIX}${category}`,
      label: availableCategories.includes(category)
        ? category
        : `${category} (unavailable)`,
      icon: <Tag className="text-violet-600! dark:text-violet-400!" />,
    })),
  ];
  return (
    <FieldGroup className="grid min-w-0 gap-3 sm:grid-cols-2">
      <DirectorySelect
        id="inventory-status"
        label="Status"
        value={statusFilter ?? "all"}
        options={statusOptions}
        alignItemWithTrigger={false}
        className={controlClassName}
        onChange={(value) =>
          onStatusChange(
            value === "active" || value === "inactive" ? value : undefined,
          )
        }
      />
      <DirectorySelect
        id="inventory-category"
        label="Category"
        value={
          categoryFilter
            ? `${CATEGORY_VALUE_PREFIX}${categoryFilter}`
            : ALL_CATEGORIES
        }
        options={categoryOptions}
        alignItemWithTrigger={false}
        className={controlClassName}
        onChange={(value) =>
          onCategoryChange(
            value.startsWith(CATEGORY_VALUE_PREFIX)
              ? value.slice(CATEGORY_VALUE_PREFIX.length)
              : undefined,
          )
        }
      />
    </FieldGroup>
  );
}
