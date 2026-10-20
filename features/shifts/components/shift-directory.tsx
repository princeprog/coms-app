"use client";

import { useShiftDirectory } from "../hooks/use-shift-directory";
import { ShiftDirectoryFilters } from "./shift-directory-filters";
import { ShiftPagination } from "./shift-pagination";
import { ShiftTable } from "./shift-table";

export function ShiftDirectory({
  branches,
  branchId,
  canReview,
  currentUserId,
  superAdmin,
}: {
  branches: { id: string; name: string }[];
  branchId: string;
  canReview: boolean;
  currentUserId: string;
  superAdmin: boolean;
}) {
  const directory = useShiftDirectory(branchId);
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Shifts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register shifts, cash counts and manager reviews.
        </p>
      </header>
      <ShiftDirectoryFilters
        directory={directory}
        branches={branches}
        branchId={branchId}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <ShiftTable
          directory={directory}
          canReview={canReview}
          currentUserId={currentUserId}
          superAdmin={superAdmin}
        />
        <ShiftPagination directory={directory} />
      </div>
    </div>
  );
}
