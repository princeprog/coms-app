import { cn } from "@/lib/utils";
import { Check, Circle, CircleDot } from "lucide-react";
import { dispatchTimestamp } from "../services/dispatch-detail-presentation";
import type { Dispatch } from "../types/dispatch.types";

export function DispatchMilestones({ dispatch }: { dispatch: Dispatch }) {
  const finished =
    dispatch.status === "RECEIVED" ||
    dispatch.status === "CLOSED_WITH_SHORTAGE";
  const firstReceipt = [...dispatch.receipts].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  )[0];
  const stages = [
    {
      label: "Created",
      timestamp: dispatch.created_at,
      actor: dispatch.created_by_name,
    },
    {
      label: "Dispatched",
      timestamp: dispatch.dispatched_at,
      actor: dispatch.dispatched_by_name,
    },
    {
      label:
        dispatch.status === "PARTIALLY_RECEIVED"
          ? "Partially received"
          : "Branch receipt",
      timestamp: firstReceipt?.created_at,
      actor: firstReceipt?.receiver_name,
    },
    {
      label:
        dispatch.status === "CLOSED_WITH_SHORTAGE"
          ? "Closed with shortage"
          : "Completed",
      timestamp: finished ? dispatch.updated_at : null,
      actor: null,
    },
  ];
  const current = finished
    ? 3
    : dispatch.status === "DRAFT"
      ? 0
      : firstReceipt
        ? 2
        : 1;
  return (
    <ol
      aria-label="Delivery milestones"
      className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-4 sm:gap-0"
    >
      {stages.map((stage, index) => {
        const Icon = stage.timestamp
          ? index === current && !finished
            ? CircleDot
            : Check
          : Circle;
        return (
          <li
            key={index}
            aria-current={index === current ? "step" : undefined}
            className="relative flex min-w-0 items-start gap-3 sm:flex-col sm:items-center sm:px-3 sm:text-center"
          >
            {index < 3 && (
              <div
                aria-hidden="true"
                className={cn(
                  "absolute top-4 left-1/2 hidden w-full border-t-2 sm:block",
                  current > index
                    ? "border-primary"
                    : "border-dashed border-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full",
                stage.timestamp
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="relative flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className="text-xs text-muted-foreground wrap-anywhere">
                {stage.timestamp ? (
                  <time dateTime={stage.timestamp}>
                    {dispatchTimestamp(stage.timestamp)}
                  </time>
                ) : finished && index === 2 ? (
                  "No receipt recorded"
                ) : (
                  "Pending"
                )}
              </span>
              {stage.actor && (
                <span className="text-xs text-muted-foreground wrap-anywhere">
                  by {stage.actor}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
