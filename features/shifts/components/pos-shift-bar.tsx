"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, LockKeyhole, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { shiftHref } from "../constants";
import type { PosShiftState } from "../services/pos-shift-state";
import { sellBlockedReason } from "../services/pos-shift-state";
import { shiftTime } from "../services/shift-time";
import { CashMovementDialog } from "./cash-movement-dialog";
import { CloseShiftDialog } from "./close-shift-dialog";
import { OpenShiftDialog } from "./open-shift-dialog";

type Dialog = "open" | "cash" | "close" | "force" | null;

export function PosShiftBar({
  branchId,
  state,
  canOperate,
  canReview,
  onChanged,
}: {
  branchId: string;
  state: PosShiftState;
  canOperate: boolean;
  canReview: boolean;
  onChanged: () => void;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const done = () => {
    setDialog(null);
    onChanged();
  };
  if (state.kind === "loading")
    return (
      <div
        aria-busy="true"
        aria-label="Loading shift"
        className="rounded-xl border p-4"
      >
        <Skeleton className="h-6 w-56" />
      </div>
    );

  const shift =
    state.kind === "own" || state.kind === "other" ? state.shift : null;
  const warning = state.kind === "own" && state.dayEnded;
  const dot =
    state.kind === "own" && !warning
      ? "bg-emerald-500"
      : state.kind === "error" || warning
        ? "bg-amber-500"
        : "bg-muted-foreground/40";
  const title =
    state.kind === "none"
      ? "No open shift"
      : state.kind === "error"
        ? "Shift status unavailable"
        : `Shift ${shift!.shift_number}${state.kind === "own" ? " · You" : ` · ${shift!.opened_by_name}`}`;
  const subtitle =
    shift && !warning
      ? `Open since ${shiftTime(shift.opened_at)}`
      : sellBlockedReason(state);

  return (
    <section
      aria-label="Register shift"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3",
        warning &&
          "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn("size-2.5 shrink-0 rounded-full", dot)}
        />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p role="status" className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {state.kind === "error" && (
          <Button
            type="button"
            variant="outline"
            className="min-h-10 gap-2"
            onClick={onChanged}
          >
            <RotateCw data-icon="inline-start" aria-hidden="true" />
            Retry
          </Button>
        )}
        {state.kind === "none" && canOperate && (
          <Button
            type="button"
            className="min-h-10"
            onClick={() => setDialog("open")}
          >
            Open shift
          </Button>
        )}
        {state.kind === "own" && (
          <>
            {!warning && (
              <Button
                type="button"
                variant="outline"
                className="min-h-10 gap-2"
                onClick={() => setDialog("cash")}
              >
                <ArrowLeftRight data-icon="inline-start" aria-hidden="true" />
                Cash in/out
              </Button>
            )}
            <Button
              type="button"
              variant={warning ? "default" : "outline"}
              className="min-h-10 gap-2"
              onClick={() => setDialog("close")}
            >
              <LockKeyhole data-icon="inline-start" aria-hidden="true" />
              Close shift
            </Button>
          </>
        )}
        {state.kind === "other" && canReview && (
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10"
              render={<Link href={shiftHref(branchId, state.shift.id)} />}
            >
              View shift
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() => setDialog("force")}
            >
              Force close
            </Button>
          </>
        )}
      </div>
      {dialog === "open" && (
        <OpenShiftDialog
          branchId={branchId}
          onClose={() => setDialog(null)}
          onOpened={done}
        />
      )}
      {dialog === "cash" && shift && (
        <CashMovementDialog
          branchId={branchId}
          shiftId={shift.id}
          onClose={() => setDialog(null)}
          onRecorded={done}
        />
      )}
      {(dialog === "close" || dialog === "force") && shift && (
        <CloseShiftDialog
          branchId={branchId}
          shift={shift}
          forced={dialog === "force"}
          onClose={() => setDialog(null)}
          onClosed={done}
        />
      )}
    </section>
  );
}
