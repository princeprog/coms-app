import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BellRing,
  Check,
  ChevronDown,
  History,
  ClipboardList,
  MessageSquare,
  PackageCheck,
  TriangleAlert,
  Truck,
} from "lucide-react";
import {
  buildDispatchActivity,
  dispatchDate,
  dispatchTime,
} from "../services/dispatch-detail-presentation";
import type { Dispatch } from "../types/dispatch.types";
import styles from "./dispatch-detail.module.css";

const icons = {
  reminder: BellRing,
  created: ClipboardList,
  dispatched: Truck,
  receipt: PackageCheck,
  shortage: TriangleAlert,
  discrepancy: MessageSquare,
};

function DispatchActivityEntries({ dispatch }: { dispatch: Dispatch }) {
  const entries = buildDispatchActivity(dispatch);
  return (
    <ol aria-label="Delivery activity" className="flex flex-col">
      {entries.map((entry) => {
        const Icon = entry.title.startsWith("Discrepancy resolved")
          ? Check
          : icons[entry.kind];
        return (
          <li
            key={entry.id}
            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0"
          >
            <div className="relative flex w-6 justify-center">
              <span
                aria-hidden="true"
                className="absolute top-6 bottom-0 border-l border-border"
              />
              <Icon
                className="relative size-5 bg-card text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <time
                dateTime={entry.timestamp}
                className="text-sm text-muted-foreground"
              >
                {dispatchDate.format(new Date(entry.timestamp))},{" "}
                {dispatchTime.format(new Date(entry.timestamp))}
              </time>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">{entry.title}</h3>
                <p className="text-sm text-muted-foreground wrap-anywhere">
                  by {entry.actor}
                </p>
              </div>
              {entry.lines && (
                <ul className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  {entry.lines.map((line, index) => (
                    <li key={index} className="min-w-0 wrap-anywhere">
                      <span className="font-medium tabular-nums">
                        {line.quantity} {line.unit}
                      </span>{" "}
                      <span className="text-muted-foreground">{line.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {entry.note && (
                <Alert
                  role="note"
                  className={cn(
                    entry.kind === "discrepancy" &&
                      dispatch.discrepancy?.status !== "RESOLVED" &&
                      !entry.title.startsWith("Discrepancy resolved") &&
                      "border-(--dispatch-warning-border) bg-(--dispatch-warning-surface) text-(--dispatch-warning-foreground) [&_[data-slot=alert-description]]:text-inherit",
                  )}
                >
                  <TriangleAlert aria-hidden="true" />
                  <AlertDescription>
                    <p className="whitespace-pre-wrap wrap-anywhere">
                      {entry.note}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DispatchActivity({
  dispatch,
  collapsible = false,
}: {
  dispatch: Dispatch;
  collapsible?: boolean;
}) {
  if (collapsible) {
    return (
      <details
        className={cn(
          styles.activity,
          "group/activity min-w-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
        )}
      >
        <summary className="dispatch-press flex min-h-16 cursor-pointer list-none items-center gap-2.5 rounded-xl px-6 py-5 text-base font-medium outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <History
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          View activity
          <span className="text-sm font-normal text-muted-foreground">PHT</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              styles.activityChevron,
              "ml-auto size-4 text-muted-foreground group-open/activity:rotate-180",
            )}
          />
        </summary>
        <div className="border-t border-border/60 p-6 sm:p-7">
          <DispatchActivityEntries dispatch={dispatch} />
        </div>
      </details>
    );
  }
  return (
    <Card className="min-w-0 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">
            Activity{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              PHT
            </span>
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DispatchActivityEntries dispatch={dispatch} />
      </CardContent>
    </Card>
  );
}
