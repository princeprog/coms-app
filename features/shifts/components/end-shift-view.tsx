"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, LockKeyhole, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { shiftHref } from "../constants";
import { useEndShift } from "../hooks/use-end-shift";
import { useMyShift } from "../hooks/use-my-shift";
import { focusFirstInvalid } from "../services/focus-invalid";
import { differenceTone, formatPeso } from "../services/shift-money";
import { posHref } from "../services/shift-paths";
import { CashCountField } from "./cash-count-field";
import { EndShiftSummary } from "./end-shift-summary";
import { PesoField } from "./peso-field";
import { ShiftCountResult } from "./shift-count-result";
import { ShiftPageFrame } from "./shift-page-frame";
import { ShiftStepper } from "./shift-stepper";

const steps = ["Review", "Count", "Confirm", "Done"] as const;

export function EndShiftView() {
  const router = useRouter();
  const mine = useMyShift();
  const flow = useEndShift(mine.data);
  const [step, setStep] = useState(0);
  const [explanation, setExplanation] = useState("");

  if (mine.isPending && !flow.closed)
    return (
      <div
        aria-busy="true"
        aria-label="Loading your shift"
        className="mx-auto w-full max-w-2xl space-y-4 py-6"
      >
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  const shift = flow.closed ?? mine.data;
  if (!shift)
    return (
      <ShiftPageFrame
        icon={LockKeyhole}
        title="No open shift"
        description="You don’t have a shift to end right now."
      >
        <Button
          className="min-h-11 w-fit gap-2"
          nativeButton={false}
          render={<Link href="/shifts/start" />}
        >
          <PlayCircle data-icon="inline-start" aria-hidden="true" />
          Start shift
        </Button>
      </ShiftPageFrame>
    );

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1 && !flow.validate()) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    if (step === 2) {
      void flow.end().then((ok) => ok && setStep(3));
      return;
    }
    if (step === 3) {
      void flow
        .explain(explanation)
        .then((ok) => ok && router.push(posHref(shift!.branch_id)));
      return;
    }
    setStep(step + 1);
  }

  const differs =
    flow.closed && differenceTone(flow.closed.cash_difference) !== "balanced";
  const primary = [
    "Count drawer",
    "Review count",
    "End shift",
    differs && explanation.trim() ? "Save and finish" : "Done",
  ][step];
  return (
    <ShiftPageFrame
      icon={LockKeyhole}
      title={step === 3 ? "Shift ended" : "End shift"}
      description={`Shift ${shift.shift_number} · ${shift.branch_name}`}
    >
      <ShiftStepper steps={steps} current={step} />
      <form
        onSubmit={next}
        noValidate
        aria-busy={flow.pending}
        className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
      >
        <div
          key={step}
          className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
        >
          {step === 0 && (
            <>
              <EndShiftSummary shift={shift} />
              <p className="text-sm text-muted-foreground">
                Next, count the drawer. Expected cash appears after you submit
                your count.
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <CashCountField
                id="end-shift-counted"
                label="Cash in drawer"
                value={flow.counted}
                onChange={flow.setCounted}
                error={flow.errors.counted}
                autoFocus
              />
              <PesoField
                id="end-shift-left"
                label="Leave for next shift"
                hint="Starting cash for the next cashier."
                value={flow.left}
                onChange={flow.setLeft}
                error={flow.errors.left}
              />
            </>
          )}
          {step === 2 && (
            <>
              <dl className="divide-y rounded-xl border text-sm">
                {[
                  ["Cash in drawer", flow.countedAmount],
                  ["Leave for next shift", flow.leftAmount],
                  ["Remove from drawer", flow.removed],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 px-4 py-3"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">
                      {formatPeso(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">
                Your count can’t be changed after you end the shift.
              </p>
            </>
          )}
          {step === 3 && flow.closed && (
            <>
              <ShiftCountResult shift={flow.closed} />
              {differs && (
                <Field>
                  <FieldLabel htmlFor="end-shift-explanation">
                    What happened?{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </FieldLabel>
                  <Textarea
                    id="end-shift-explanation"
                    rows={3}
                    maxLength={500}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                  />
                </Field>
              )}
            </>
          )}
          {flow.errors.form && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              {flow.errors.form}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          {step === 0 ? (
            <Button
              variant="ghost"
              className="min-h-11"
              nativeButton={false}
              render={<Link href={posHref(shift.branch_id)} />}
            >
              Back to Point of Sale
            </Button>
          ) : step < 3 ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 gap-2"
              disabled={flow.pending}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="min-h-11"
              nativeButton={false}
              render={<Link href={shiftHref(shift.branch_id, shift.id)} />}
            >
              View shift
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            className="min-h-11 gap-2"
            disabled={flow.pending}
          >
            {flow.pending && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {flow.pending && step === 2 ? "Ending…" : primary}
          </Button>
        </div>
      </form>
    </ShiftPageFrame>
  );
}
