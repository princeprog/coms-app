"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shiftKeys } from "../query-keys";
import { getShiftAction } from "../services/shift-actions";
import { differenceTone } from "../services/shift-money";
import { businessDayLabel, shiftDateTime } from "../services/shift-time";
import { CloseShiftDialog } from "./close-shift-dialog";
import { ShiftActivity } from "./shift-activity";
import { ShiftCountSummary } from "./shift-count-summary";
import { ShiftNoteForm } from "./shift-note-form";
import { ShiftNotes } from "./shift-notes";
import { ShiftStatusBadge } from "./shift-status-badge";

export function ShiftDetailView({
  branchId,
  shiftId,
  currentUserId,
  canReview,
  superAdmin,
}: {
  branchId: string;
  shiftId: string;
  currentUserId: string;
  canReview: boolean;
  superAdmin: boolean;
}) {
  const client = useQueryClient();
  const [forcing, setForcing] = useState(false);
  const query = useQuery({
    queryKey: shiftKeys.detail(branchId, shiftId),
    queryFn: async () => {
      const result = await getShiftAction(branchId, shiftId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
  const refresh = () =>
    void client.invalidateQueries({ queryKey: shiftKeys.all });
  const back = (
    <Link
      href={`/shifts?branch=${branchId}`}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Shifts
    </Link>
  );
  if (query.isPending)
    return (
      <div
        aria-busy="true"
        aria-label="Loading shift"
        className="flex flex-col gap-4"
      >
        {back}
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  if (query.isError)
    return (
      <div className="flex flex-col gap-4">
        {back}
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border p-6"
        >
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  const shift = query.data;
  const own = shift.opened_by_user_id === currentUserId;
  const reviewable =
    shift.status === "CLOSED" && canReview && (!own || superAdmin);
  const explainable =
    shift.status === "CLOSED" &&
    own &&
    !shift.cashier_explanation &&
    shift.close_type === "CASHIER" &&
    differenceTone(shift.cash_difference) !== "balanced";
  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      {back}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Shift {shift.shift_number}
            </h1>
            <ShiftStatusBadge status={shift.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {businessDayLabel(shift.business_date)} · {shift.opened_by_name} ·
            Opened {shiftDateTime(shift.opened_at)}
            {shift.closed_at && ` · Closed ${shiftDateTime(shift.closed_at)}`}
          </p>
        </div>
        {shift.status === "OPEN" && canReview && !own && (
          <Button
            variant="outline"
            className="min-h-10"
            onClick={() => setForcing(true)}
          >
            Force close
          </Button>
        )}
      </header>
      <ShiftCountSummary shift={shift} />
      <ShiftActivity shift={shift} />
      <ShiftNotes shift={shift} />
      {explainable && (
        <ShiftNoteForm
          branchId={branchId}
          shift={shift}
          mode="explain"
          onSaved={refresh}
        />
      )}
      {reviewable && (
        <ShiftNoteForm
          branchId={branchId}
          shift={shift}
          mode="review"
          onSaved={refresh}
        />
      )}
      {shift.status === "CLOSED" && canReview && own && !superAdmin && (
        <p role="status" className="text-sm text-muted-foreground">
          Another manager must review a shift you worked.
        </p>
      )}
      {forcing && (
        <CloseShiftDialog
          branchId={branchId}
          shift={shift}
          forced
          onClose={() => setForcing(false)}
          onClosed={() => {
            setForcing(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
