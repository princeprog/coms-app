import { cn } from "@/lib/utils";
import { Check, Circle, CircleDot } from "lucide-react";
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
    },
    {
      label: "Dispatched",
      timestamp: dispatch.dispatched_at,
    },
    {
      label: dispatch.counted_at
        ? "Branch count"
        : firstReceipt
          ? "Partially received"
          : "Branch count",
      timestamp: dispatch.counted_at ?? firstReceipt?.created_at,
    },
    {
      label:
        dispatch.status === "CLOSED_WITH_SHORTAGE"
          ? "Resolved with variance"
          : "Completed",
      timestamp: finished ? dispatch.updated_at : null,
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
      className="grid gap-y-4 border-b border-border/60 px-6 py-5 sm:grid-cols-4 sm:gap-x-3 sm:px-7"
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
            className="relative flex min-w-0 items-center gap-2"
          >
            <span
              className={cn(
                "relative flex size-7 shrink-0 items-center justify-center rounded-full",
                stage.timestamp
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="relative flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className="sr-only">
                {stage.timestamp ? "Done" : "Pending"}
              </span>
            </div>
            {index < stages.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 left-3.5 h-2.5 w-0.5 -translate-x-1/2 rounded-full sm:static sm:mr-3 sm:ml-1 sm:h-0.5 sm:min-w-3 sm:flex-1 sm:translate-x-0",
                  index < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
