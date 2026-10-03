"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type {
  CreateDispatchInput,
  DispatchStockOption,
} from "../types/dispatch.types";

export function DispatchSendReview({
  input,
  branchName,
  stockItems,
  pending,
  error,
  onBack,
}: {
  input: CreateDispatchInput;
  branchName: string;
  stockItems: DispatchStockOption[];
  pending: boolean;
  error: string;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        <h3
          ref={heading}
          tabIndex={-1}
          className="text-lg font-semibold outline-none"
        >
          Review dispatch
        </h3>
        <p className="text-sm">
          Send to <strong>{branchName}</strong>
        </p>
        <ul
          className="divide-y rounded-lg border px-4"
          aria-label="Items to send"
        >
          {input.items.map((line) => {
            const item = stockItems.find(
              (stock) => stock.id === line.stock_item_id,
            );
            return (
              <li
                key={line.stock_item_id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span>{item?.stock_item_name}</span>
                <strong className="tabular-nums">
                  {line.quantity_dispatched} {item?.unit}
                </strong>
              </li>
            );
          })}
        </ul>
        <p className="rounded-md border bg-muted/30 p-3 text-sm">
          Confirm that this stock is leaving the commissary. Sending will deduct
          commissary inventory.
        </p>
        <p className="text-sm text-muted-foreground">
          Branch inventory increases when branch staff confirm the quantities
          actually received.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4 sm:p-6">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onBack}
        >
          Back to edit
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Confirm dispatch"}
        </Button>
      </DialogFooter>
    </>
  );
}
