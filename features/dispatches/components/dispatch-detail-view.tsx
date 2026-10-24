import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Dispatch,
  DispatchPostAction,
  DispatchReceiveAction,
  DispatchShortageAction,
} from "../types/dispatch.types";
import { isDispatchComplete } from "../services/dispatch-completion-summary";
import { DispatchActivity } from "./dispatch-activity";
import { DispatchCompletedSummary } from "./dispatch-completed-summary";
import { DispatchDeliveryFacts } from "./dispatch-delivery-facts";
import { DispatchDetailHeader } from "./dispatch-detail-header";
import { DispatchItemTable } from "./dispatch-item-table";
import { DispatchMilestones } from "./dispatch-milestones";
import { DispatchNextActions } from "./dispatch-next-actions";
import { DispatchDiscrepancyAlertHost } from "./dispatch-discrepancy-alert";
import styles from "./dispatch-detail.module.css";
import { DispatchReceivingFollowup } from "./dispatch-receiving-followup";

export type DispatchDetailViewProps = {
  dispatch: Dispatch;
  canDispatch: boolean;
  canRemind?: boolean;
  postAction: DispatchPostAction;
  canReceive: boolean;
  receiveAction: DispatchReceiveAction;
  canResolve: boolean;
  resolveAction: DispatchShortageAction;
};

export function DispatchDetailView(props: DispatchDetailViewProps) {
  const { dispatch } = props;
  const completed = isDispatchComplete(dispatch);
  return (
    <div
      data-coms-ui="operational"
      className={`${styles.page} mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-7 pb-4`}
    >
      <DispatchDetailHeader dispatch={dispatch} />
      <DispatchReceivingFollowup
        dispatch={dispatch}
        canReview={props.canResolve}
        canRemind={props.canRemind}
      />
      {completed ? (
        <DispatchCompletedSummary dispatch={dispatch} />
      ) : (
        <Card className="min-w-0 gap-0 rounded-2xl py-0 shadow-sm ring-foreground/10">
          <CardContent className="grid min-w-0 p-0 xl:grid-cols-[16rem_minmax(0,1fr)]">
            <DispatchDeliveryFacts dispatch={dispatch} />
            <section
              aria-labelledby="dispatch-stock-heading"
              className="order-1 min-w-0 xl:order-2"
            >
              <DispatchMilestones dispatch={dispatch} />
              <CardHeader className="flex flex-row items-center gap-2.5 px-6 py-6 sm:px-7">
                <CardTitle>
                  <h2
                    id="dispatch-stock-heading"
                    className="text-lg font-semibold"
                  >
                    {dispatch.status === "DRAFT"
                      ? "Planned stock items"
                      : dispatch.counted_at
                        ? "Sent and counted"
                        : "Stock items"}
                  </h2>
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="min-h-6 rounded-md text-sm tabular-nums transition-none"
                  aria-label={`${dispatch.items.length} stock items`}
                >
                  {dispatch.items.length}
                </Badge>
              </CardHeader>
              <DispatchItemTable dispatch={dispatch} />
              <DispatchNextActions {...props} />
            </section>
          </CardContent>
        </Card>
      )}
      <DispatchActivity dispatch={dispatch} collapsible />
      <DispatchDiscrepancyAlertHost />
    </div>
  );
}
