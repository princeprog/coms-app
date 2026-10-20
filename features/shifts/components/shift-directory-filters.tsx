"use client";

import {
  Building2,
  CircleCheck,
  CircleDot,
  Clock3,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { useShiftDirectory } from "../hooks/use-shift-directory";

const statusOptions = [
  {
    value: "all",
    label: "All statuses",
    icon: <ListFilter className="text-violet-600" />,
  },
  {
    value: "OPEN",
    label: "Open",
    icon: <CircleDot className="text-blue-600" />,
  },
  {
    value: "CLOSED",
    label: "Needs review",
    icon: <Clock3 className="text-amber-600" />,
  },
  {
    value: "REVIEWED",
    label: "Reviewed",
    icon: <CircleCheck className="text-emerald-600" />,
  },
];

export function ShiftDirectoryFilters({
  directory,
  branches,
  branchId,
}: {
  directory: ReturnType<typeof useShiftDirectory>;
  branches: { id: string; name: string }[];
  branchId: string;
}) {
  const { query, update } = directory;
  const triggerSize =
    "[&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:px-3";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {branches.length > 1 && (
          <DirectorySelect
            id="shift-branch"
            label="Branch"
            hideLabel
            alignItemWithTrigger={false}
            className={`sm:w-56 ${triggerSize}`}
            value={branchId}
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
              icon: <Building2 className="text-sky-600" />,
            }))}
            onChange={(value) => update({ branch: value })}
          />
        )}
        <DirectorySelect
          id="shift-status"
          label="Status"
          hideLabel
          alignItemWithTrigger={false}
          className={`sm:w-52 ${triggerSize}`}
          value={query.status || "all"}
          options={statusOptions}
          onChange={(value) =>
            update({
              status: value === "all" ? "" : (value as typeof query.status),
            })
          }
        />
        {(["date_from", "date_to"] as const).map((name) => (
          <div key={name} className="w-full sm:w-52">
            <DatePicker
              id={`shift-${name}`}
              label={
                name === "date_from" ? "From business day" : "To business day"
              }
              value={query[name]}
              clearable
              className="h-11"
              onChange={(value) => update({ [name]: value })}
            />
          </div>
        ))}
        {directory.hasFilters && (
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            onClick={() => update({ status: "", date_from: "", date_to: "" })}
          >
            Clear filters
          </Button>
        )}
      </div>
      {query.date_from && query.date_to && query.date_from > query.date_to && (
        <p role="alert" className="text-sm text-destructive">
          The end date must be on or after the start date.
        </p>
      )}
    </div>
  );
}
