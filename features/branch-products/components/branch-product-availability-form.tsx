"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BranchProductDiscardConfirmation } from "@/features/branch-products/components/branch-product-discard-confirmation";
import { branchProductAvailabilitySchema } from "@/features/branch-products/schemas/branch-product.schema";
import type {
  BranchProductMutationResult,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";

export function BranchProductAvailabilityForm({
  branchId,
  productId,
  productName,
  isAvailable: savedAvailability,
  productIsActive,
  canUpdate,
  action,
}: {
  branchId: string;
  productId: string;
  productName: string;
  isAvailable: boolean;
  productIsActive: boolean;
  canUpdate: boolean;
  action: BranchProductOperationAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(savedAvailability);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [discardOpen, setDiscardOpen] = useState(false);
  const canChangeAvailability = canUpdate && productIsActive;
  const dirty = isAvailable !== savedAvailability;
  const isAvailableValue = isAvailable ? "available" : "not_available";

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setOpen(false);
    setError("");
  }

  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setIsAvailable(savedAvailability);
      setError("");
      setStatus("");
      setOpen(true);
      return;
    }
    requestClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !canChangeAvailability || !dirty) return;
    const parsed = branchProductAvailabilitySchema.safeParse({
      is_available: isAvailable,
    });
    if (!parsed.success) {
      setError("Choose whether this product is available for sale.");
      return;
    }
    setError("");
    startTransition(async () => {
      let result: BranchProductMutationResult;
      try {
        result = await action(branchId, productId, parsed.data);
      } catch {
        result = {
          ok: false,
          error: "COMS could not save this branch product. Try again.",
        };
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setStatus("Availability saved.");
      router.refresh();
    });
  }

  if (!canChangeAvailability) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger
          render={<Button type="button" variant="outline" size="sm" />}
        >
          Change availability
        </DialogTrigger>
        <DialogContent
          data-coms-ui="operational"
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Change availability</DialogTitle>
            <DialogDescription>
              Choose whether {productName} can be sold at this branch.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor={`offer-availability-${productId}`}>
                  Availability
                </FieldLabel>
                <Select
                  value={isAvailableValue}
                  onValueChange={(value) => {
                    setIsAvailable(value === "available");
                    setError("");
                  }}
                >
                  <SelectTrigger
                    id={`offer-availability-${productId}`}
                    className="w-full"
                  >
                    <SelectValue>
                      {(value: unknown) =>
                        value === "available"
                          ? "Available for sale"
                          : "Not available for sale"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent data-coms-ui="operational">
                    <SelectItem value="available">
                      Available for sale
                    </SelectItem>
                    <SelectItem value="not_available">
                      Not available for sale
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={requestClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !dirty}>
                {pending ? "Saving…" : "Save availability"}
              </Button>
            </DialogFooter>
          </form>
          <BranchProductDiscardConfirmation
            title="Discard unsaved availability changes?"
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            onDiscard={() => {
              setIsAvailable(savedAvailability);
              setError("");
              setDiscardOpen(false);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      {status && (
        <p role="status" aria-live="polite" className="text-xs">
          {status}
        </p>
      )}
    </div>
  );
}
