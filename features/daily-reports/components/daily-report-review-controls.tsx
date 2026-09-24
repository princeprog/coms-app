"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyReportApprovalControl } from "@/features/daily-reports/components/daily-report-approval-control";
import { DailyReportReturnForm } from "@/features/daily-reports/components/daily-report-return-form";
import type {
  DailyReport,
  DailyReportReturnAction,
  DailyReportTransitionAction,
} from "@/features/daily-reports/types/daily-report.types";

export function DailyReportReviewControls({
  branchId,
  report,
  canSubmit,
  canReturn,
  canApprove,
  submitAction,
  returnAction,
  approveAction,
  onReportChange,
}: {
  branchId: string;
  report: DailyReport;
  canSubmit: boolean;
  canReturn: boolean;
  canApprove: boolean;
  submitAction: DailyReportTransitionAction;
  returnAction: DailyReportReturnAction;
  approveAction: DailyReportTransitionAction;
  onReportChange: (report: DailyReport) => void;
}) {
  const router = useRouter();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isEditable = report.status === "DRAFT" || report.status === "RETURNED";
  const isReviewable = report.status === "SUBMITTED";

  async function runAction(
    action: () => Promise<
      { ok: true; report: DailyReport } | { ok: false; error: string }
    >,
  ) {
    if (pending) return false;
    setPending(true);
    setError("");
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      onReportChange(result.report);
      router.refresh();
      return true;
    } catch {
      setError("COMS could not complete this report action. Review and retry.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function submit() {
    await runAction(() => submitAction(branchId, report.id));
  }

  async function returnForCorrection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Enter a reason for returning this report.");
      return;
    }
    const changed = await runAction(() =>
      returnAction(branchId, report.id, { reason: normalizedReason }),
    );
    if (changed) {
      setShowReturnForm(false);
      setReason("");
    }
  }

  async function approve() {
    await runAction(() => approveAction(branchId, report.id));
  }

  const submitAvailable = canSubmit && isEditable;
  const returnAvailable = canReturn && isReviewable;
  const approveAvailable = canApprove && isReviewable;

  if (!submitAvailable && !returnAvailable && !approveAvailable) return null;

  return (
    <section
      aria-label="Report actions"
      className="flex flex-col gap-3 rounded-4xl border bg-card p-4"
    >
      <div className="flex flex-wrap gap-2">
        {submitAvailable && (
          <Button
            type="button"
            disabled={pending}
            onClick={() => void submit()}
          >
            {pending ? "Submitting…" : "Submit for review"}
          </Button>
        )}
        {returnAvailable && !showReturnForm && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setShowReturnForm(true);
              setError("");
            }}
          >
            Return for correction
          </Button>
        )}
        {approveAvailable && (
          <DailyReportApprovalControl
            pending={pending}
            onConfirm={() => void approve()}
          />
        )}
      </div>
      {showReturnForm && returnAvailable && (
        <DailyReportReturnForm
          reportId={report.id}
          reason={reason}
          pending={pending}
          onSubmit={returnForCorrection}
          onReasonChange={(value) => {
            setReason(value);
            setError("");
          }}
          onCancel={() => {
            setShowReturnForm(false);
            setReason("");
            setError("");
          }}
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
