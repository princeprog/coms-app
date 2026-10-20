"use client";

import { useState } from "react";
import Link from "next/link";
import { LockKeyhole, PlayCircle, RotateCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shiftHref } from "../constants";
import type { PosShiftState } from "../services/pos-shift-state";
import { posHref } from "../services/shift-paths";
import { shiftTime } from "../services/shift-time";
import { CloseShiftDialog } from "./close-shift-dialog";

function GateCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof PlayCircle;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-label="Register"
      className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center shadow-xs motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.98] motion-safe:duration-200"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex flex-wrap justify-center gap-2">{children}</div>
      )}
    </section>
  );
}

/** Point of Sale opens only for the cashier on shift; everyone else sees what to do next. */
export function PosShiftGate({
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
  const [forcing, setForcing] = useState(false);
  const back = encodeURIComponent(posHref(branchId));
  if (state.kind === "loading")
    return (
      <div
        aria-busy="true"
        aria-label="Checking your shift"
        className="mx-auto w-full max-w-lg"
      >
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  if (state.kind === "error")
    return (
      <GateCard
        icon={RotateCw}
        title="Shift status unavailable"
        description={state.message}
      >
        <Button variant="outline" className="min-h-11" onClick={onChanged}>
          Try again
        </Button>
      </GateCard>
    );
  if (state.kind === "none")
    return (
      <GateCard
        icon={PlayCircle}
        title="Start your shift to use the register"
        description="Count the cash in the drawer before your first sale."
      >
        {canOperate ? (
          <Button
            size="lg"
            className="min-h-11 gap-2"
            render={
              <Link href={`/shifts/start?branch=${branchId}&return=${back}`} />
            }
          >
            <PlayCircle data-icon="inline-start" aria-hidden="true" />
            Start shift
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your role can’t start shifts. Ask a manager.
          </p>
        )}
      </GateCard>
    );
  if (state.kind === "other")
    return (
      <GateCard
        icon={UserRound}
        title={`${state.shift.opened_by_name} is on the register`}
        description={`Shift ${state.shift.shift_number} since ${shiftTime(state.shift.opened_at)}. Only they can sell until it ends.`}
      >
        {canReview && (
          <>
            <Button
              variant="outline"
              className="min-h-11"
              render={<Link href={shiftHref(branchId, state.shift.id)} />}
            >
              View shift
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setForcing(true)}
            >
              Force close
            </Button>
          </>
        )}
        {forcing && (
          <CloseShiftDialog
            branchId={branchId}
            shift={state.shift}
            forced
            onClose={() => setForcing(false)}
            onClosed={() => {
              setForcing(false);
              onChanged();
            }}
          />
        )}
      </GateCard>
    );
  if (state.dayEnded)
    return (
      <GateCard
        icon={LockKeyhole}
        title="The business day has ended"
        description={`End shift ${state.shift.shift_number} and start a new one to keep selling.`}
      >
        <Button
          size="lg"
          className="min-h-11"
          render={<Link href="/shifts/end" />}
        >
          End shift
        </Button>
      </GateCard>
    );
  return null;
}
