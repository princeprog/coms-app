import { isPositiveDecimalQuantity } from "../services/decimal-quantity";
import type { DispatchDetailViewProps } from "./dispatch-detail-view";
import { DispatchDiscrepancyControl } from "./dispatch-discrepancy-control";
import { DispatchPostControl } from "./dispatch-post-control";
import { DispatchReceiveControl } from "./dispatch-receive-control";
import { DispatchShortageControl } from "./dispatch-shortage-control";

export function DispatchNextActions({
  dispatch,
  canDispatch,
  postAction,
  canReceive,
  receiveAction,
  canCloseShortage,
  shortageAction,
  canReportDiscrepancy,
  discrepancyAction,
  canRequestRecount,
  recountAction,
}: DispatchDetailViewProps) {
  const draft = dispatch.status === "DRAFT";
  const finished =
    dispatch.status === "RECEIVED" ||
    dispatch.status === "CLOSED_WITH_SHORTAGE";
  const remaining = dispatch.items.filter((item) =>
    isPositiveDecimalQuantity(item.quantity_in_transit),
  );
  const active = !draft && !finished && remaining.length > 0;
  const showRecount = active && canRequestRecount && recountAction;
  const description = draft
    ? "Review the planned quantities before sending this stock from the commissary."
    : dispatch.status === "RECEIVED"
      ? "All dispatched stock has been received by the branch."
      : dispatch.status === "CLOSED_WITH_SHORTAGE"
        ? "All stock is accounted for through branch receipts and reasoned shortage closures. Closed shortages were not added to branch inventory."
        : dispatch.discrepancy?.status === "RECOUNT_REQUESTED"
          ? "A recount has been requested. Record any stock found as another receipt, or close confirmed missing stock with a reason."
          : showRecount
            ? `Ask ${dispatch.branch_name} to verify the remaining stock before closing a confirmed shortage.`
            : "Record the quantities that arrived at the branch. Unreceived stock remains in transit until received or closed with a reason.";
  return (
    <section
      aria-labelledby="dispatch-next-action-heading"
      className="flex min-w-0 flex-col gap-3"
    >
      <h2 id="dispatch-next-action-heading" className="text-lg font-semibold">
        {dispatch.status === "RECEIVED"
          ? "Delivery complete"
          : dispatch.status === "CLOSED_WITH_SHORTAGE"
            ? "Delivery closed with shortage"
            : "Next action"}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      {active && (
        <ul
          aria-label="Stock remaining in transit"
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
        >
          {remaining.map((item) => (
            <li key={item.id} className="min-w-0 wrap-anywhere">
              <strong className="font-medium text-foreground tabular-nums">
                {item.quantity_in_transit} {item.unit}
              </strong>{" "}
              {item.stock_item_name}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 [&_button]:max-w-full [&_button]:whitespace-normal">
        {draft && canDispatch && (
          <DispatchPostControl dispatchId={dispatch.id} action={postAction} />
        )}
        {showRecount && (
          <DispatchDiscrepancyControl
            dispatch={dispatch}
            mode="recount"
            action={recountAction}
            primary
          />
        )}
        {active && canReceive && (
          <DispatchReceiveControl
            dispatch={dispatch}
            action={receiveAction}
            primary={!showRecount}
          />
        )}
        {active && canCloseShortage && (
          <DispatchShortageControl
            dispatch={dispatch}
            action={shortageAction}
          />
        )}
        {active && canReportDiscrepancy && discrepancyAction && (
          <DispatchDiscrepancyControl
            dispatch={dispatch}
            mode="report"
            action={discrepancyAction}
          />
        )}
      </div>
      {showRecount && (
        <p className="text-xs text-muted-foreground">
          A reason is required. The recount request is saved in the dispatch
          history.
        </p>
      )}
    </section>
  );
}
