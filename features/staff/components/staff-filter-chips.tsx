"use client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StaffStatusFilter } from "../services/staff-page-params";
import { staffStatusOptions } from "./staff-filter-options";
export function StaffFilterChips({
  search,
  status,
  selectedBranchId,
  isSuperAdmin,
  branchLabel,
  onApply,
}: {
  search: string;
  status: StaffStatusFilter;
  selectedBranchId?: string;
  isSuperAdmin: boolean;
  branchLabel?: string;
  onApply: (change: {
    search?: string;
    status?: StaffStatusFilter;
    branchId?: string;
  }) => void;
}) {
  const hasFilters =
    Boolean(search) ||
    status !== "all" ||
    (isSuperAdmin && Boolean(selectedBranchId));
  return (
    <>
      {hasFilters && (
        <div
          aria-label="Active staff filters"
          className="flex flex-wrap items-center gap-2"
        >
          {search && (
            <Button
              variant="outline"
              size="sm"
              className="h-auto max-w-full whitespace-normal"
              aria-label="Clear search"
              onClick={() => {
                onApply({ search: "" });
                document.getElementById("staff-search")?.focus();
              }}
            >
              <span className="min-w-0 wrap-anywhere">Search: {search}</span>
              <X aria-hidden="true" />
            </Button>
          )}
          {status !== "all" && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Clear status"
              onClick={() => {
                document.getElementById("staff-status")?.focus();
                onApply({ status: "all" });
              }}
            >
              Status:{" "}
              {
                staffStatusOptions.find((option) => option.value === status)
                  ?.label
              }
              <X aria-hidden="true" />
            </Button>
          )}
          {isSuperAdmin && selectedBranchId && (
            <Button
              variant="outline"
              size="sm"
              className="h-auto max-w-full whitespace-normal"
              aria-label="Clear branch"
              onClick={() => {
                document.getElementById("staff-branch-scope")?.focus();
                onApply({ branchId: undefined });
              }}
            >
              <span className="min-w-0 wrap-anywhere">
                Branch: {branchLabel}
              </span>
              <X aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onApply({
                search: "",
                status: "all",
                branchId: isSuperAdmin ? undefined : selectedBranchId,
              });
              document.getElementById("staff-search")?.focus();
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </>
  );
}
