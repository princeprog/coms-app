"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  CreateDispatchInput,
  DispatchStockOption,
} from "../types/dispatch.types";

export function DispatchSendReview({
  input,
  branchName,
  stockItems,
  deliveredBy,
  pending,
  error,
  onDeliveredByChange,
  onBack,
}: {
  input: CreateDispatchInput;
  branchName: string;
  stockItems: DispatchStockOption[];
  deliveredBy: string;
  pending: boolean;
  error: string;
  onDeliveredByChange: (value: string) => void;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 sm:px-6">
        <h3
          ref={heading}
          tabIndex={-1}
          className="text-sm font-medium text-muted-foreground outline-none"
        >
          Review dispatch
        </h3>
        <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-sm font-medium">Branch</span>
            <p className="flex min-h-10 items-center text-sm wrap-anywhere">
              {branchName}
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="dispatch-delivered-by">
              Delivered by
            </FieldLabel>
            <Input
              id="dispatch-delivered-by"
              aria-required="true"
              maxLength={120}
              autoComplete="off"
              placeholder="Driver or courier name"
              className="h-10 bg-background px-3"
              disabled={pending}
              value={deliveredBy}
              onChange={(event) => onDeliveredByChange(event.target.value)}
            />
          </Field>
        </div>
        <ul className="divide-y divide-border/60" aria-label="Items to send">
          <li
            aria-hidden="true"
            className="flex justify-between pb-2.5 text-sm font-medium"
          >
            <span>Stock item</span>
            <span>Quantity</span>
          </li>
          {input.items.map((line) => {
            const item = stockItems.find(
              (stock) => stock.id === line.stock_item_id,
            );
            return (
              <li
                key={line.stock_item_id}
                className="flex items-start justify-between gap-4 py-3.5 text-sm"
              >
                <span className="min-w-0 wrap-anywhere">
                  {item?.stock_item_name}
                </span>
                <strong className="shrink-0 font-medium tabular-nums">
                  {line.quantity_dispatched} {item?.unit}
                </strong>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Sending deducts these quantities from commissary inventory.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter className="m-0 shrink-0 gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:items-center sm:px-6">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 px-4 sm:min-h-10"
          disabled={pending}
          onClick={onBack}
        >
          Back to edit
        </Button>
        <Button
          type="submit"
          className="min-h-11 gap-2 px-4 sm:min-h-10"
          disabled={pending}
        >
          {pending && (
            <LoaderCircleIcon
              data-icon="inline-start"
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {pending ? "Sending…" : "Confirm dispatch"}
        </Button>
      </DialogFooter>
    </>
  );
}
