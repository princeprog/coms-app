"use client";

import { DispatchDeadlineField } from "./dispatch-deadline-field";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Building2Icon, LoaderCircleIcon } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
  deliveredByError,
  receiveBy,
  deadlineError,
  onReceiveByChange,
  pending,
  error,
  onDeliveredByChange,
  onBack,
}: {
  input: CreateDispatchInput;
  branchName: string;
  stockItems: DispatchStockOption[];
  deliveredBy: string;
  deliveredByError: string;
  receiveBy: string;
  deadlineError: string;
  onReceiveByChange: (value: string) => void;
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
        <h3 ref={heading} tabIndex={-1} className="sr-only outline-none">
          Review dispatch
        </h3>
        <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/25 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
            <Building2Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Destination branch
            </p>
            <p className="font-semibold wrap-anywhere">{branchName}</p>
          </div>
        </div>
        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2 sm:items-start">
          <legend className="sr-only">Delivery details</legend>
          <Field data-invalid={!!deliveredByError}>
            <FieldLabel htmlFor="dispatch-delivered-by">
              Delivered by
            </FieldLabel>
            <Input
              id="dispatch-delivered-by"
              aria-required="true"
              aria-invalid={!!deliveredByError}
              aria-describedby={
                deliveredByError ? "dispatch-delivered-by-error" : undefined
              }
              maxLength={120}
              autoComplete="off"
              placeholder="Driver or courier name"
              className="h-11 bg-background px-3"
              disabled={pending}
              value={deliveredBy}
              onChange={(event) => onDeliveredByChange(event.target.value)}
            />
            {deliveredByError && (
              <FieldError id="dispatch-delivered-by-error">
                {deliveredByError}
              </FieldError>
            )}
          </Field>
          <DispatchDeadlineField
            value={receiveBy}
            error={deadlineError}
            disabled={pending}
            onChange={onReceiveByChange}
          />
        </fieldset>
        <section className="space-y-3" aria-label="Stock items to dispatch">
          <ul
            className="overflow-hidden rounded-lg border divide-y divide-border/60"
            aria-label="Items to send"
          >
            <li
              aria-hidden="true"
              className="flex justify-between gap-4 bg-muted/40 px-4 py-3 text-sm font-medium"
            >
              <span>Stock items</span>
              <span>Quantity</span>
            </li>
            {input.items.map((line) => {
              const item = stockItems.find(
                (stock) => stock.id === line.stock_item_id,
              );
              return (
                <li
                  key={line.stock_item_id}
                  className="flex items-start justify-between gap-4 px-4 py-3.5 text-sm"
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
            Stock is deducted when you confirm.
          </p>
        </section>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter className="m-0 shrink-0 gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:items-center sm:px-6">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 px-4"
          disabled={pending}
          onClick={onBack}
        >
          Back to edit
        </Button>
        <Button
          type="submit"
          className="min-h-11 gap-2 px-4"
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
