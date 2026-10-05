"use client";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import type {
  DispatchCreateAction,
  DispatchCreateOptions,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchCreateLineFields } from "./dispatch-create-line-fields";

import { useDispatchSendForm } from "../hooks/use-dispatch-send-form";
import { DispatchBranchField } from "./dispatch-branch-field";
import { DispatchSendReview } from "./dispatch-send-review";

export function DispatchCreateForm({
  options,
  action,
  onPendingChange,
  onDirtyChange,
  onCancel,
  onCreated,
}: {
  options: DispatchCreateOptions;
  action: DispatchCreateAction;
  onPendingChange: (pending: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const {
    pending,
    error,
    branchId,
    setBranchId,
    lines,
    setLines,
    review,
    setReview,
    setError,
    updateLine,
    submit,
    nextLineKey,
  } = useDispatchSendForm({
    action,
    onPendingChange,
    onDirtyChange,
    onCreated,
  });

  return (
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Create dispatch"
    >
      {review ? (
        <DispatchSendReview
          input={review}
          branchName={
            options.branches.find((branch) => branch.id === review.branch_id)
              ?.branch_name ?? ""
          }
          stockItems={lines.flatMap((line) => (line.stock ? [line.stock] : []))}
          pending={pending}
          error={error}
          onBack={() => {
            setReview(null);
            setError("");
          }}
        />
      ) : (
        <>
          <FieldGroup className="min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-6">
            <FieldSet className="gap-3">
              <FieldLegend variant="label">Destination</FieldLegend>
              <DispatchBranchField
                branches={options.branches}
                branchId={branchId}
                disabled={pending}
                onChange={(value) => {
                  setBranchId(value);
                  onDirtyChange(true);
                }}
              />
            </FieldSet>
            <DispatchCreateLineFields
              lines={lines}
              availabilityVisible={options.availabilityVisible === true}
              onStockSelect={(key, stock) => {
                setLines((current) =>
                  current.map((line) =>
                    line.key === key
                      ? {
                          ...line,
                          stock_item_id: stock?.id ?? "",
                          stock: stock ?? undefined,
                        }
                      : line,
                  ),
                );
                onDirtyChange(true);
              }}
              disabled={pending}
              onChange={updateLine}
              onRemove={(key) => {
                setLines((current) =>
                  current.filter((line) => line.key !== key),
                );
                onDirtyChange(true);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={pending || lines.length >= 100}
              onClick={() => {
                setLines((current) => [
                  ...current,
                  {
                    key: nextLineKey.current++,
                    stock_item_id: "",
                    quantity_dispatched: "",
                  },
                ]);
                onDirtyChange(true);
              }}
            >
              <Plus data-icon="inline-start" />
              Add stock item
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {options.availabilityVisible
                ? "Available quantities are advisory. Stock is checked again when sending."
                : "Availability is checked when sending. Your account does not have commissary inventory visibility."}
            </p>
          </FieldGroup>
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4 sm:p-6">
            <p className="flex-1 text-sm text-muted-foreground sm:mr-auto">
              {lines.length} {lines.length === 1 ? "item" : "items"} · Review
              before sending
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Review &amp; send
            </Button>
          </DialogFooter>
        </>
      )}
    </form>
  );
}
