"use client";

import { DailyReportDeliveries } from "./daily-report-deliveries";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  hasUnsavedChanges,
  canSubmit,
  canPrepareSubmission = canSubmit,
  canReturn,
  canApprove,
  submitAction,
  returnAction,
  approveAction,
  onReportChange,
  placement = "panel",
}: {
  branchId: string;
  report: DailyReport;
  hasUnsavedChanges: boolean;
  canSubmit: boolean;
  canPrepareSubmission?: boolean;
  canReturn: boolean;
  canApprove: boolean;
  submitAction: DailyReportTransitionAction;
  returnAction: DailyReportReturnAction;
  approveAction: DailyReportTransitionAction;
  onReportChange: (report: DailyReport) => void;
  placement?: "header" | "panel";
}) {
  const router = useRouter();
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [deliveryReasons, setDeliveryReasons] = useState<
    Record<string, string>
  >({});
  const [attempted, setAttempted] = useState(false);
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
    if (
      !canPrepareSubmission ||
      !canSubmit ||
      !isEditable ||
      hasUnsavedChanges ||
      pending
    )
      return;
    setAttempted(true);
    const deliveries = report.submission_checklist_bypassed
      ? []
      : (report.pending_deliveries ?? []);
    const missing = deliveries.find(
      (item) => !deliveryReasons[item.id]?.trim(),
    );
    if (missing) {
      document.getElementById(`delivery-exception-${missing.id}`)?.focus();
      return;
    }
    await runAction(() =>
      deliveries.length
        ? submitAction(branchId, report.id, {
            delivery_exceptions: deliveries.map((item) => ({
              dispatch_id: item.id,
              reason: deliveryReasons[item.id].trim(),
            })),
          })
        : submitAction(branchId, report.id),
    );
  }

  const submitAvailable = canPrepareSubmission && isEditable;
  const submitBlockedHintId = `report-submit-blocked-${report.id}`;
  const returnAvailable = canReturn && isReviewable;
  const approveAvailable = canApprove && isReviewable;

  if (!submitAvailable && !returnAvailable && !approveAvailable) return null;

  return (
    <section
      aria-label="Report actions"
      className={cn(
        "flex flex-col gap-3",
        placement === "header"
          ? "w-full sm:w-auto"
          : "rounded-lg border bg-card p-4",
      )}
    >
      {submitAvailable && !report.submission_checklist_bypassed && (
        <DailyReportDeliveries
          report={report}
          reasons={deliveryReasons}
          attempted={attempted}
          pending={pending}
          onChange={(id, value) =>
            setDeliveryReasons((current) => ({ ...current, [id]: value }))
          }
        />
      )}
      <div
        className={cn(
          "flex flex-wrap gap-2",
          placement === "header" && "flex-col sm:flex-row sm:justify-end",
        )}
      >
        {submitAvailable && (
          <Button
            type="button"
            disabled={pending || hasUnsavedChanges || !canSubmit}
            aria-describedby={!canSubmit ? submitBlockedHintId : undefined}
            onClick={() => void submit()}
          >
            {pending ? "Submitting…" : "Submit for review"}
          </Button>
        )}
        {returnAvailable && (
          <DailyReportReturnForm
            reportId={report.id}
            open={showReturnForm}
            pending={pending}
            disabled={hasUnsavedChanges}
            error={error}
            onOpenChange={(open) => {
              setShowReturnForm(open);
              setError("");
            }}
            onConfirm={(reason) =>
              runAction(() => returnAction(branchId, report.id, { reason }))
            }
            onClearError={() => setError("")}
          />
        )}
        {approveAvailable && (
          <DailyReportApprovalControl
            pending={pending}
            disabled={hasUnsavedChanges}
            onConfirm={() =>
              void runAction(() => approveAction(branchId, report.id))
            }
          />
        )}
      </div>
      {submitAvailable && !canSubmit && (
        <p id={submitBlockedHintId} className="text-sm text-muted-foreground">
          Complete the “Before you submit” checklist above to enable submission.
        </p>
      )}
      {hasUnsavedChanges && (
        <p role="status" className="text-sm text-muted-foreground">
          Save or discard unsaved counts before changing report status.
        </p>
      )}
      {error && !showReturnForm && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
