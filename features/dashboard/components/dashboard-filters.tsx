"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardData } from "@/features/dashboard/schemas/dashboard.schema";
import type { DashboardRangeDays } from "@/features/dashboard/services/dashboard-date-range";

const rangeChoices: DashboardRangeDays[] = [7, 30, 90];

export function DashboardFilters({
  branches,
  canViewGlobal,
  rangeDays,
  selectedBranchId,
  onRangeDaysChange,
  onBranchChange,
}: {
  branches: DashboardData["branches"];
  canViewGlobal: boolean;
  rangeDays: DashboardRangeDays;
  selectedBranchId: string;
  onRangeDaysChange: (days: DashboardRangeDays) => void;
  onBranchChange: (branchId: string) => void;
}) {
  const showBranchSelector = branches.length > 1;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {showBranchSelector && (
        <div className="grid gap-2">
          <label htmlFor="dashboard-branch" className="text-sm font-medium">
            Location
          </label>
          <Select
            value={selectedBranchId || "all"}
            onValueChange={(value) => onBranchChange(value ?? "all")}
          >
            <SelectTrigger id="dashboard-branch" className="w-full sm:w-56">
              <SelectValue placeholder="Select location">
                {(value: unknown) => {
                  const selected = String(value);
                  if (selected === "all") return "All branches";
                  return (
                    branches.find((branch) => branch.branch_id === selected)
                      ?.branch_name ?? "Select location"
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {canViewGlobal && (
                <SelectItem value="all">All branches</SelectItem>
              )}
              {branches.map((branch) => (
                <SelectItem key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Date range</legend>
        <div
          className="flex rounded-md border p-1"
          aria-label="Dashboard date range"
        >
          {rangeChoices.map((days) => (
            <Button
              key={days}
              type="button"
              size="sm"
              variant={rangeDays === days ? "default" : "ghost"}
              aria-pressed={rangeDays === days}
              onClick={() => onRangeDaysChange(days)}
            >
              {days} days
            </Button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
