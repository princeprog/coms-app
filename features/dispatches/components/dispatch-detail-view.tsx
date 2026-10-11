import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  Dispatch,
  DispatchPostAction,
  DispatchReceiveAction,
  DispatchShortageAction,
  DispatchDiscrepancyAction,
} from "../types/dispatch.types";
import { DispatchActivity } from "./dispatch-activity";
import { DispatchDetailHeader } from "./dispatch-detail-header";
import { DispatchItemTable } from "./dispatch-item-table";
import { DispatchMilestones } from "./dispatch-milestones";
import { DispatchNextActions } from "./dispatch-next-actions";
import { DispatchStatusBadge } from "./dispatch-status-badge";

export type DispatchDetailViewProps = {
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
};

export function DispatchDetailView(props: DispatchDetailViewProps) {
  const { dispatch } = props;
  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
      <DispatchDetailHeader dispatch={dispatch} />
      <DispatchMilestones dispatch={dispatch} />
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <DispatchActivity dispatch={dispatch} />
        <Card className="min-w-0 [--card-spacing:--spacing(5)]">
          <CardHeader>
            <CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {dispatch.status === "DRAFT"
                    ? "Planned stock items"
                    : "Current item balances"}
                </h2>
                {dispatch.discrepancy && (
                  <DispatchStatusBadge
                    status={dispatch.discrepancy.status}
                    label={
                      dispatch.discrepancy.status === "OPEN"
                        ? "Open discrepancy"
                        : dispatch.discrepancy.status === "RESOLVED"
                          ? "Discrepancy resolved"
                          : "Recount requested"
                    }
                  />
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {dispatch.status === "DRAFT"
                ? "Stock is deducted from the commissary only when this dispatch is sent."
                : "In transit = dispatched − received − shortage closed. Receipt progress is shown for each item."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-w-0 flex-col gap-5">
            <DispatchItemTable dispatch={dispatch} />
            <Separator />
            <DispatchNextActions {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
