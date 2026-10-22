"use client";

import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Building2,
  Layers,
} from "lucide-react";
import { DatePicker } from "@/components/shared/date-picker";
import { DirectorySelect } from "@/components/shared/directory-select";
import { Button } from "@/components/ui/button";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type { DailyReportPageFilters } from "../services/daily-report-page-params";

const ALL = "all";
const triggerSize =
  "[&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3";

export function DailyReportDirectoryFilters({
  filters,
  branches,
  hasFilters,
  onChange,
  onClear,
}: {
  filters: DailyReportPageFilters;
  branches: BranchProductBranchOption[];
  hasFilters: boolean;
  onChange: (patch: Partial<DailyReportPageFilters>) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {branches.length > 1 && (
        <DirectorySelect
          id="daily-report-branch"
          label="Branch"
          hideLabel
          alignItemWithTrigger={false}
          className={`sm:w-60 ${triggerSize}`}
          value={filters.branchId ?? ALL}
          options={[
            {
              value: ALL,
              label: "All branches",
              icon: <Layers className="text-violet-600" />,
            },
            ...branches.map((branch) => ({
              value: branch.id,
              label:
                branch.status === "inactive"
                  ? `${branch.name} (inactive)`
                  : branch.name,
              icon: <Building2 className="text-sky-600" />,
            })),
          ]}
          onChange={(value) =>
            onChange({ branchId: value === ALL ? undefined : value })
          }
        />
      )}
      <div className="w-full sm:w-48">
        <DatePicker
          id="daily-report-date-from"
          label="From business date"
          placeholder="From date"
          value={filters.dateFrom ?? ""}
          clearable
          className="h-11"
          onChange={(value) =>
            onChange({
              dateFrom: value || undefined,
              // Keep the range valid instead of sending an empty result.
              ...(value && filters.dateTo && value > filters.dateTo
                ? { dateTo: undefined }
                : {}),
            })
          }
        />
      </div>
      <div className="w-full sm:w-48">
        <DatePicker
          id="daily-report-date-to"
          label="To business date"
          placeholder="To date"
          value={filters.dateTo ?? ""}
          clearable
          className="h-11"
          onChange={(value) =>
            onChange({
              dateTo: value || undefined,
              ...(value && filters.dateFrom && value < filters.dateFrom
                ? { dateFrom: undefined }
                : {}),
            })
          }
        />
      </div>
      <DirectorySelect
        id="daily-report-sort"
        label="Sort"
        hideLabel
        alignItemWithTrigger={false}
        className={`sm:w-44 ${triggerSize}`}
        value={filters.sort}
        options={[
          {
            value: "newest",
            label: "Newest first",
            icon: <ArrowDownWideNarrow className="text-emerald-600" />,
          },
          {
            value: "oldest",
            label: "Oldest first",
            icon: <ArrowUpNarrowWide className="text-amber-600" />,
          },
        ]}
        onChange={(value) =>
          onChange({ sort: value === "oldest" ? "oldest" : "newest" })
        }
      />
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={onClear}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
