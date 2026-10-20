"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { useShiftDirectory } from "../hooks/use-shift-directory";
import { businessDayLabel, shiftDateTime } from "../services/shift-time";
import { ShiftDifference } from "./shift-difference";
import { ShiftRowActions } from "./shift-row-actions";
import { ShiftStatusBadge } from "./shift-status-badge";

export function ShiftTable({
  directory,
  canReview,
  currentUserId,
  superAdmin,
}: {
  directory: ReturnType<typeof useShiftDirectory>;
  canReview: boolean;
  currentUserId: string;
  superAdmin: boolean;
}) {
  const { result, loading, showSkeleton } = directory;
  if (result.isError)
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 px-6 py-12 text-center"
      >
        <p>Shifts could not be loaded.</p>
        <Button variant="outline" onClick={() => result.refetch()}>
          Try again
        </Button>
      </div>
    );
  if (!showSkeleton && result.data && result.data.items.length === 0)
    return (
      <div className="px-6 py-10">
        <OperationalEmptyState
          title={
            directory.hasFilters
              ? "No shifts match these filters"
              : "No shifts yet"
          }
          description={
            directory.hasFilters
              ? "Change or clear the filters to see more shifts."
              : "Shifts appear here once a cashier opens one at Point of Sale."
          }
        />
      </div>
    );
  return (
    <Table
      aria-label="Register shifts"
      aria-busy={loading}
      className="min-w-3xl"
    >
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="pl-5">Shift</TableHead>
          <TableHead>Cashier</TableHead>
          <TableHead>Opened</TableHead>
          <TableHead>Closed</TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="text-right">Cash difference</TableHead>
          <TableHead className="pl-6">Status</TableHead>
          <TableHead className="w-12 pr-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {showSkeleton || !result.data
          ? Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={8} className="px-5 py-4">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          : result.data.items.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="py-3.5 pl-5">
                  <span className="font-medium">
                    Shift {shift.shift_number}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {businessDayLabel(shift.business_date)}
                  </span>
                </TableCell>
                <TableCell>{shift.opened_by_name}</TableCell>
                <TableCell className="tabular-nums">
                  {shiftDateTime(shift.opened_at)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {shift.closed_at ? (
                    <>
                      {shiftDateTime(shift.closed_at)}
                      {shift.close_type === "FORCED" && (
                        <span className="block text-xs text-muted-foreground">
                          Force closed
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Still open</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {shift.sales_count}
                </TableCell>
                <TableCell className="text-right">
                  <ShiftDifference value={shift.cash_difference} />
                </TableCell>
                <TableCell className="pl-6">
                  <ShiftStatusBadge status={shift.status} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <ShiftRowActions
                    shift={shift}
                    canReview={
                      canReview &&
                      (superAdmin || shift.opened_by_user_id !== currentUserId)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
