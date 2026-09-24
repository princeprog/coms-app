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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BranchProductDiscardConfirmation } from "@/features/branch-products/components/branch-product-discard-confirmation";
import { branchProductPriceSchema } from "@/features/branch-products/schemas/branch-product.schema";
import type {
  BranchProductMutationResult,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";

export function BranchProductPriceForm({
  branchId,
  productId,
  productName,
  currentPrice,
  productIsActive,
  canUpdate,
  action,
}: {
  branchId: string;
  productId: string;
  productName: string;
  currentPrice: string;
  productIsActive: boolean;
  canUpdate: boolean;
  action: BranchProductOperationAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [discardOpen, setDiscardOpen] = useState(false);
  const isEditable = canUpdate && productIsActive;
  const dirty = price !== currentPrice;

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
      setPrice(currentPrice);
      setError("");
      setStatus("");
      setOpen(true);
      return;
    }
    requestClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !isEditable || !dirty) return;
    const parsed = branchProductPriceSchema.safeParse({ price });
    if (!parsed.success) {
      setError("Enter a nonnegative decimal price.");
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
      setPrice(parsed.data.price);
      setOpen(false);
      setStatus("Price saved.");
      router.refresh();
    });
  }

  if (!isEditable) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger
          render={<Button type="button" variant="outline" size="sm" />}
        >
          Change price
        </DialogTrigger>
        <DialogContent
          data-coms-ui="operational"
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Change price</DialogTitle>
            <DialogDescription>
              Update the branch price for {productName}. Current price:{" "}
              {currentPrice}.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor={`offer-price-${productId}`}>
                  Price <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={`offer-price-${productId}`}
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={80}
                  value={price}
                  disabled={pending}
                  onChange={(event) => {
                    setPrice(event.target.value);
                    setError("");
                  }}
                  aria-invalid={Boolean(error)}
                />
                <FieldDescription>
                  Enter a nonnegative decimal. COMS keeps the entered precision.
                </FieldDescription>
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
                {pending ? "Saving…" : "Save price"}
              </Button>
            </DialogFooter>
          </form>
          <BranchProductDiscardConfirmation
            title="Discard unsaved price changes?"
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            onDiscard={() => {
              setPrice(currentPrice);
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
