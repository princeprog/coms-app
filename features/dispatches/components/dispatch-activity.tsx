import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Check,
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

const icons = {
  created: ClipboardList,
  dispatched: Truck,
  receipt: PackageCheck,
  shortage: TriangleAlert,
  discrepancy: MessageSquare,
};

export function DispatchActivity({ dispatch }: { dispatch: Dispatch }) {
  const entries = buildDispatchActivity(dispatch);
  return (
    <Card className="min-w-0 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Delivery activity</h2>
        </CardTitle>
        <CardDescription>
          Chronological history of this dispatch. All times in PHT.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol aria-label="Delivery activity" className="flex flex-col">
          {entries.map((entry) => {
            const Icon = entry.title.startsWith("Discrepancy resolved")
              ? Check
              : icons[entry.kind];
            return (
              <li
                key={entry.id}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 pb-6 last:pb-0 sm:grid-cols-[auto_auto_minmax(0,1fr)]"
              >
                <time
                  dateTime={entry.timestamp}
                  className="hidden w-24 flex-col gap-1 text-xs text-muted-foreground tabular-nums sm:flex"
                >
                  <span>{dispatchDate.format(new Date(entry.timestamp))}</span>
                  <span>{dispatchTime.format(new Date(entry.timestamp))}</span>
                </time>
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
                    className="text-xs text-muted-foreground sm:hidden"
                  >
                    {dispatchDate.format(new Date(entry.timestamp))},{" "}
                    {dispatchTime.format(new Date(entry.timestamp))} PHT
                  </time>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">{entry.title}</h3>
                    <p className="text-xs text-muted-foreground wrap-anywhere">
                      by {entry.actor}
                    </p>
                  </div>
                  {entry.kind === "created" && (
                    <p className="text-sm text-muted-foreground">
                      Dispatch to {dispatch.branch_name} created with{" "}
                      {dispatch.items.length} stock{" "}
                      {dispatch.items.length === 1 ? "item" : "items"}.
                    </p>
                  )}
                  {entry.kind === "dispatched" && (
                    <p className="text-sm text-muted-foreground">
                      Stock sent from the commissary to {dispatch.branch_name}.
                    </p>
                  )}
                  {entry.kind === "receipt" && entry.lines && (
                    <p className="text-sm text-muted-foreground">
                      Received quantities recorded at {dispatch.branch_name}.
                    </p>
                  )}
                  {entry.kind === "discrepancy" &&
                    entry.title === "Discrepancy reported" && (
                      <p className="text-sm text-muted-foreground">
                        A delivery discrepancy was reported by the branch.
                      </p>
                    )}
                  {entry.lines && (
                    <ul className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                      {entry.lines.map((line, index) => (
                        <li key={index} className="min-w-0 wrap-anywhere">
                          <span className="font-medium tabular-nums">
                            {line.quantity} {line.unit}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {line.name}
                          </span>
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
      </CardContent>
    </Card>
  );
}
