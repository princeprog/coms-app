import { varianceLines } from "../services/dispatch-detail-presentation";
import type { DispatchDetailViewProps } from "./dispatch-detail-view";
import { DispatchPostControl } from "./dispatch-post-control";
import { DispatchReceiveControl } from "./dispatch-receive-control";
import { DispatchResolveControl } from "./dispatch-resolve-control";

export function DispatchNextActions(props: DispatchDetailViewProps) {
  const { dispatch, canDispatch, postAction, canReceive, receiveAction } =
    props;
  const { canResolve, resolveAction } = props;
  const variance = varianceLines(dispatch);
  const canSend = dispatch.status === "DRAFT" && canDispatch;
  const canCount =
    canReceive && dispatch.items.some((item) => item.awaiting_count);
  const canResolveVariance = canResolve && variance.length > 0;
  if (!canSend && !canCount && variance.length === 0) return null;
  return (
    <section
      aria-labelledby="dispatch-next-action-heading"
      className="flex min-w-0 flex-col gap-4 border-t border-border/60 bg-muted/15 px-6 py-5 sm:px-7"
    >
      <h2 id="dispatch-next-action-heading" className="sr-only">
        Dispatch actions
      </h2>
      {variance.length > 0 && (
        <ul
          aria-label="Unresolved count differences"
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
        >
          {variance.map(({ item, amount, direction }) => (
            <li key={item.id} className="min-w-0 wrap-anywhere">
              <strong className="font-medium text-foreground tabular-nums">
                {amount} {item.unit} {direction === "short" ? "short" : "over"}
              </strong>{" "}
              {item.stock_item_name}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap justify-end gap-2 [&_button]:min-h-11 [&_button]:max-w-full [&_button]:whitespace-normal">
        {canSend && (
          <DispatchPostControl dispatchId={dispatch.id} action={postAction} />
        )}
        {canCount && (
          <DispatchReceiveControl
            dispatch={dispatch}
            action={receiveAction}
            primary
          />
        )}
        {canResolveVariance && (
          <DispatchResolveControl dispatch={dispatch} action={resolveAction} />
        )}
      </div>
    </section>
  );
}
