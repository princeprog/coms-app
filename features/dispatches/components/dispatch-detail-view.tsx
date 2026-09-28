import Link from "next/link";
import { format, parseISO } from "date-fns";
import { OperationalStatusBadge } from "@/components/shared/operational-page-ui";
import { buttonVariants } from "@/components/ui/button";
import type {
  Dispatch,
  DispatchPostAction,
  DispatchReceiveAction,
  DispatchShortageAction,
  DispatchDiscrepancyAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchHistory } from "./dispatch-history";
import { DispatchItemTable } from "./dispatch-item-table";
import { DispatchPostControl } from "./dispatch-post-control";
import { DispatchReceiveControl } from "./dispatch-receive-control";
import { DispatchShortageControl } from "./dispatch-shortage-control";
import { DispatchDiscrepancyControl } from "./dispatch-discrepancy-control";

export function DispatchDetailView({
  dispatch,
  canDispatch,
  postAction,
  canReceive,
  receiveAction,
  canCloseShortage,
  shortageAction,
  canReportDiscrepancy = false,
  discrepancyAction,
  canRequestRecount = false,
  recountAction,
}: {
  dispatch: Dispatch;
  canDispatch: boolean;
  postAction: DispatchPostAction;
  canReceive: boolean;
  receiveAction: DispatchReceiveAction;
  canCloseShortage: boolean;
  shortageAction: DispatchShortageAction;
  canReportDiscrepancy?: boolean;
  discrepancyAction?: DispatchDiscrepancyAction;
  canRequestRecount?: boolean;
  recountAction?: DispatchDiscrepancyAction;
}) {
  const showPostControl = dispatch.status === "DRAFT" && canDispatch;
  const showReceiveControl =
    (dispatch.status === "IN_TRANSIT" ||
      dispatch.status === "PARTIALLY_RECEIVED") &&
    canReceive;
  const showShortageControl =
    (dispatch.status === "IN_TRANSIT" ||
      dispatch.status === "PARTIALLY_RECEIVED") &&
    canCloseShortage;

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href="/dispatches"
        >
          Back to dispatches
        </Link>
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={`/replenishment/${dispatch.stock_request_id}`}
        >
          View stock request
        </Link>
        {showPostControl && (
          <DispatchPostControl dispatchId={dispatch.id} action={postAction} />
        )}
        {showReceiveControl && (
          <DispatchReceiveControl dispatch={dispatch} action={receiveAction} />
        )}
        {showShortageControl && (
          <DispatchShortageControl
            dispatch={dispatch}
            action={shortageAction}
          />
        )}
        {canReportDiscrepancy && discrepancyAction && (
          <DispatchDiscrepancyControl
            dispatch={dispatch}
            mode="report"
            action={discrepancyAction}
          />
        )}
        {canRequestRecount && recountAction && (
          <DispatchDiscrepancyControl
            dispatch={dispatch}
            mode="recount"
            action={recountAction}
          />
        )}
      </div>
      <section
        aria-labelledby="dispatch-summary-heading"
        className="rounded-lg border bg-card"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4 md:p-5">
          <div className="flex flex-col gap-1">
            <h2 id="dispatch-summary-heading" className="text-lg font-semibold">
              Dispatch to {dispatch.branch_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Stock request status: {dispatch.stock_request_status}
            </p>
          </div>
          <OperationalStatusBadge variant="outline">
            {dispatch.status.replaceAll("_", " ")}
          </OperationalStatusBadge>
        </header>
        <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-4 md:p-5">
          <DetailField label="Created by" value={dispatch.created_by_name} />
          <DetailField
            label="Created"
            value={format(parseISO(dispatch.created_at), "PPp")}
          />
          <DetailField
            label="Dispatched by"
            value={dispatch.dispatched_by_name ?? "Not dispatched"}
          />
          <DetailField
            label="Dispatched at"
            value={
              dispatch.dispatched_at
                ? format(parseISO(dispatch.dispatched_at), "PPp")
                : "Not dispatched"
            }
          />
        </dl>
      </section>
      <section
        aria-labelledby="dispatch-quantities-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2
            id="dispatch-quantities-heading"
            className="text-lg font-semibold"
          >
            Dispatch quantities
          </h2>
          <p className="text-sm text-muted-foreground">
            In-transit quantity is the dispatched amount less receipts and
            explicitly closed shortages.
          </p>
        </div>
        <DispatchItemTable dispatch={dispatch} />
      </section>
      <DispatchHistory dispatch={dispatch} />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
