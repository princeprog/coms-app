"use client";

import { useShiftDirectory } from "../hooks/use-shift-directory";
import { ShiftSelfAction } from "./shift-self-action";
import { ShiftDirectoryFilters } from "./shift-directory-filters";
import { ShiftPagination } from "./shift-pagination";
import { ShiftTable } from "./shift-table";

export function ShiftDirectory({
  branches,
  branchId,
  canReview,
  currentUserId,
  superAdmin,
  canOperate,
}: {
  branches: { id: string; name: string }[];
  branchId: string;
  canReview: boolean;
  currentUserId: string;
  superAdmin: boolean;
  canOperate: boolean;
}) {
  const directory = useShiftDirectory(branchId);
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cash shifts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register shifts, cash counts and manager reviews.
          </p>
        </div>
        {canOperate && <ShiftSelfAction />}
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
