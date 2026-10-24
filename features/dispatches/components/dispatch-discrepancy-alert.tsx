"use client";

import { useSyncExternalStore } from "react";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { completedDifference } from "../services/dispatch-completion-summary";
import type { DispatchCountDifference } from "../types/dispatch.types";

// The count control unmounts when the page refreshes after a final count, so
// the open alert lives in a small store rendered by a host that stays mounted.
const none: DispatchCountDifference[] = [];
let shown = none;
const listeners = new Set<() => void>();

export function showDispatchDiscrepancy(
  differences: DispatchCountDifference[],
) {
  shown = differences.length ? differences : none;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Render once on the delivery page; shows the alert when a count differs. */
export function DispatchDiscrepancyAlertHost() {
  const differences = useSyncExternalStore(
    subscribe,
    () => shown,
    () => none,
  );
  return (
    <DispatchDiscrepancyAlert
      differences={differences}
      onClose={() => showDispatchDiscrepancy(none)}
    />
  );
}

/** Shown once after a final count that differs from what was sent. */
export function DispatchDiscrepancyAlert({
  differences,
  onClose,
}: {
  differences: DispatchCountDifference[];
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={differences.length > 0}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        data-coms-ui="operational"
        className="overflow-hidden border-t-4 border-t-amber-500 sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="size-11 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delivery count has a discrepancy</AlertDialogTitle>
          <AlertDialogDescription>
            Your count was recorded, but it doesn&apos;t match what the
            commissary sent. They will review the difference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul
          aria-label="Items that differ"
          className="flex max-h-64 flex-col divide-y overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/5"
        >
          {differences.map((item) => {
            const short = item.quantity_variance.startsWith("-");
            return (
              <li
                key={item.stock_item_name}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 font-medium wrap-anywhere">
                  {item.stock_item_name}
                </span>
                <Badge
                  className={cn(
                    "shrink-0 text-white tabular-nums",
                    short ? "bg-red-700" : "bg-amber-700",
                  )}
                >
                  {completedDifference(item.quantity_variance, item.unit)}
                </Badge>
              </li>
            );
          })}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel variant="default" className="min-h-10">
            OK, got it
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
