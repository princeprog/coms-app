"use client";

import { PackageOpen, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestockSuggestions } from "../hooks/use-restock-suggestions";
import type { RestockSuggestion } from "../schemas/restock-suggestion.schema";

const enter =
  "animate-in duration-200 ease-out-quint fade-in-0 motion-safe:slide-in-from-top-1";

/** Offers the branch's low items, with quantities that reach each target. */
export function DispatchRestockSuggestions({
  branchId,
  branchName,
  presentStockIds,
  disabled,
  onAdd,
}: {
  branchId: string;
  branchName: string;
  presentStockIds: Set<string>;
  disabled: boolean;
  onAdd: (suggestions: RestockSuggestion[]) => void;
}) {
  const query = useRestockSuggestions(branchId);
  if (!branchId) return null;
  if (query.isPending)
    return (
      <div aria-busy="true" aria-label="Checking stock levels">
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  if (query.isError)
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground"
      >
        Restock suggestions are unavailable right now.
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 active:scale-97"
          onClick={() => query.refetch()}
        >
          <RotateCw data-icon="inline-start" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );

  const items = query.data;
  if (!items.length) return null;
  const sendable = items.filter((item) => Number(item.quantity_to_send) > 0);
  const remaining = sendable.filter(
    (item) => !presentStockIds.has(item.stock_item_id),
  );
  const unavailable = items.filter(
    (item) => Number(item.quantity_to_send) === 0,
  );
  return (
    <section
      aria-label="Restock suggestions"
      className={
        "flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30 " +
        enter
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        <PackageOpen
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
        />
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          <p className="font-medium">
            {items.length} {items.length === 1 ? "item needs" : "items need"}{" "}
            restocking at {branchName}
          </p>
          <p className="text-muted-foreground">
            {remaining.length
              ? "Quantities fill each item to its target, counting deliveries on the way."
              : sendable.length
                ? "All suggested items are on this dispatch."
                : "The commissary has none of these to send."}
          </p>
          {unavailable.length > 0 && sendable.length > 0 && (
            <p className="text-amber-800 dark:text-amber-300">
              Not enough at commissary:{" "}
              {unavailable.map((item) => item.stock_item_name).join(", ")}
            </p>
          )}
        </div>
      </div>
      {remaining.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="min-h-10 shrink-0 bg-background active:scale-97"
          disabled={disabled}
          onClick={() => onAdd(items)}
        >
          Add {remaining.length} suggested{" "}
          {remaining.length === 1 ? "item" : "items"}
        </Button>
      )}
    </section>
  );
}
