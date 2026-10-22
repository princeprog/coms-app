"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { shiftKeys } from "../query-keys";
import { getShiftAction } from "../services/shift-actions";
import { differenceTone } from "../services/shift-money";
import { CloseShiftDialog } from "./close-shift-dialog";
import { ShiftCashDrawer } from "./shift-cash-drawer";
import { ShiftFacts } from "./shift-facts";
import { ShiftHeadline } from "./shift-headline";
import { ShiftNoteForm } from "./shift-note-form";
import { ShiftProductsSold } from "./shift-products-sold";
import { ShiftReportHeader } from "./shift-report-header";
import styles from "./shift-report.module.css";
import { ShiftSalesBreakdown } from "./shift-sales-breakdown";
import { ShiftTimeline } from "./shift-timeline";

const pageClass = cn(
  styles.page,
  "mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 pb-4",
);

function ShiftReportSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading shift"
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}

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
      className="shift-press inline-flex min-h-9 w-fit items-center gap-2 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Back to shifts
    </Link>
  );
  if (query.isPending)
    return (
      <div data-coms-ui="operational" className={pageClass}>
        {back}
        <ShiftReportSkeleton />
      </div>
    );
  if (query.isError)
    return (
      <div data-coms-ui="operational" className={pageClass}>
        {back}
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl p-6 ring-1 ring-foreground/10"
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
    <div data-coms-ui="operational" className={pageClass}>
      <ShiftReportHeader
        shift={shift}
        back={back}
        action={
          shift.status === "OPEN" &&
          canReview &&
          !own && (
            <Button
              variant="outline"
              className="min-h-10 self-start sm:self-center"
              onClick={() => setForcing(true)}
            >
              Force close
            </Button>
          )
        }
      />
      <ShiftHeadline shift={shift} />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <ShiftCashDrawer shift={shift} />
            <ShiftSalesBreakdown shift={shift} />
          </div>
          <ShiftProductsSold shift={shift} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
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
            <p
              role="status"
              className="rounded-2xl bg-muted/40 px-5 py-4 text-sm text-muted-foreground ring-1 ring-foreground/10"
            >
              Another manager must review a shift you worked.
            </p>
          )}
          <ShiftFacts shift={shift} />
          <ShiftTimeline shift={shift} />
        </div>
      </div>
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
