"use client";
import Link from "next/link";
import type { Dispatch } from "../types/dispatch.types";
import { LateCountActions } from "./late-count-actions";
import { receivingTime } from "../services/receiving-time";
import { ReceivingStatusBadge } from "./receiving-status-badge";

export function DispatchReceivingFollowup({
  dispatch,
  canReview,
}: {
  dispatch: Dispatch;
  canReview: boolean;
}) {
  const count = dispatch.late_counts?.[0];
  if (!dispatch.receive_by && !count) return null;
  return (
    <section
      className="space-y-4 rounded-xl border bg-card p-5"
      aria-label="Receiving follow-up"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-semibold">Receiving</h2>
          {dispatch.receive_by && (
            <p className="text-sm text-muted-foreground">
              Estimated arrival {receivingTime(dispatch.receive_by)} PHT
            </p>
          )}
        </div>
        <ReceivingStatusBadge status={dispatch.receiving_status} />
      </div>
      {dispatch.delivery_date && (
        <p className="text-sm">
          Actual delivery: <strong>{dispatch.delivery_date}</strong>
          {dispatch.late_reason ? ` \u00b7 ${dispatch.late_reason}` : ""}
        </p>
      )}
      {count && (
        <div className="space-y-3 text-sm">
          <p>
            Delivery date: <strong>{count.delivery_date.slice(0, 10)}</strong> ·
            Submitted {receivingTime(count.created_at)} PHT
          </p>
          {count.late_reason && <p>{count.late_reason}</p>}
          {count.review_reason && (
            <p className="text-amber-700 dark:text-amber-300">
              Returned: {count.review_reason}
            </p>
          )}
          <ul className="divide-y">
            {count.items.map((item) => (
              <li
                key={item.dispatch_item_id}
                className="flex justify-between gap-3 py-2"
              >
                <span>
                  {dispatch.items.find(
                    (line) => line.id === item.dispatch_item_id,
                  )?.stock_item_name ?? "Stock item"}
                </span>
                <span className="shrink-0 tabular-nums">
                  {item.quantity}{" "}
                  {
                    dispatch.items.find(
                      (line) => line.id === item.dispatch_item_id,
                    )?.unit
                  }
                </span>
              </li>
            ))}
          </ul>
          {count.status === "PENDING" && (
            <>
              <p className="font-medium">
                {dispatch.late_count_blockers?.some(
                  (report) => report.status === "APPROVED",
                )
                  ? "Approved report requires correction. This count remains on hold."
                  : dispatch.late_count_blockers?.length
                    ? "Return affected submitted reports before posting this count."
                    : "Saved count is ready to post."}
              </p>
              {!!dispatch.late_count_blockers?.length && (
                <ul className="flex flex-wrap gap-3">
                  {dispatch.late_count_blockers.map((report) => (
                    <li key={report.id}>
                      {canReview ? (
                        <Link
                          className="underline underline-offset-4"
                          href={`/reports?branch_id=${dispatch.branch_id}&report_id=${report.id}`}
                        >
                          {report.business_date} · {report.status.toLowerCase()}
                        </Link>
                      ) : (
                        <span>
                          {report.business_date} · {report.status.toLowerCase()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canReview && (
                <LateCountActions
                  dispatchId={dispatch.id}
                  caseId={count.id}
                  blocked={!!dispatch.late_count_blockers?.length}
                />
              )}
            </>
          )}
        </div>
      )}
      {(dispatch.late_counts?.length ?? 0) > 1 && (
        <details className="text-sm">
          <summary className="cursor-pointer">
            Previous count submissions
          </summary>
          <ul className="mt-3 space-y-2">
            {dispatch.late_counts!.slice(1).map((previous) => (
              <li key={previous.id}>
                {receivingTime(previous.created_at)} ·{" "}
                {previous.status.toLowerCase()}
                {previous.review_reason ? ` — ${previous.review_reason}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
