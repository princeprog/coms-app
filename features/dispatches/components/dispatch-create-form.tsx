"use client";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ArrowRightIcon } from "lucide-react";
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
    quantityErrors,
    branchId,
    setBranchId,
    lines,
    setLines,
    review,
    setReview,
    deliveredBy,
    deliveredByError,
    receiveBy,
    deadlineError,
    setReceiveBy,
    setDeliveredBy,
    setError,
    updateLine,
    submit,
    nextLineKey,
  } = useDispatchSendForm({
    availabilityVisible: options.availabilityVisible === true,
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
      aria-busy={pending}
    >
      {review ? (
        <DispatchSendReview
          input={review}
          branchName={
            options.branches.find((branch) => branch.id === review.branch_id)
              ?.branch_name ?? ""
          }
          stockItems={lines.flatMap((line) => (line.stock ? [line.stock] : []))}
          deliveredBy={deliveredBy}
          deliveredByError={deliveredByError}
          receiveBy={receiveBy}
          deadlineError={deadlineError}
          onReceiveByChange={setReceiveBy}
          pending={pending}
          error={error}
          onDeliveredByChange={setDeliveredBy}
          onBack={() => {
            setReview(null);
            setError("");
          }}
        />
      ) : (
        <>
          <FieldGroup className="min-h-0 flex-1 gap-6 overflow-y-auto px-5 pb-6 sm:px-6">
            <DispatchBranchField
              branches={options.branches}
              branchId={branchId}
              disabled={pending}
              onChange={(value) => {
                setBranchId(value);
                onDirtyChange(true);
              }}
            />
            <DispatchCreateLineFields
              lines={lines}
              quantityErrors={quantityErrors}
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
              onAdd={() => {
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
              onChange={updateLine}
              onRemove={(key) => {
                setLines((current) =>
                  current.filter((line) => line.key !== key),
                );
                onDirtyChange(true);
              }}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </FieldGroup>
          <DialogFooter className="m-0 shrink-0 gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:items-center sm:px-6">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-4"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-11 gap-2 px-4"
              disabled={pending}
            >
              Review &amp; send
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </>
      )}
    </form>
  );
}
