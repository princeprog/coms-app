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
import { BranchProductCreateFields } from "@/features/branch-products/components/branch-product-create-fields";
import { BranchProductDiscardConfirmation } from "@/features/branch-products/components/branch-product-discard-confirmation";
import { branchProductCreateSchema } from "@/features/branch-products/schemas/branch-product.schema";
import type {
  BranchProductMutationResult,
  BranchProductProductOption,
} from "@/features/branch-products/types/branch-product.types";

export type BranchProductCreateAction = (
  branchId: string,
  input: unknown,
) => Promise<BranchProductMutationResult>;

export function BranchProductCreateForm({
  branchId,
  branchName,
  products,
  action,
}: {
  branchId: string;
  branchName: string;
  products: BranchProductProductOption[];
  action: BranchProductCreateAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty = Boolean(productId || price);

  function clearDraft() {
    setProductId("");
    setPrice("");
    setError("");
  }

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
      setError("");
      setStatus("");
      setOpen(true);
      return;
    }
    requestClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = branchProductCreateSchema.safeParse({
      product_id: productId,
      price,
    });
    if (!parsed.success) {
      setError("Select a product and enter a nonnegative decimal price.");
      return;
    }
    setError("");
    startTransition(async () => {
      let result: BranchProductMutationResult;
      try {
        result = await action(branchId, parsed.data);
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
      clearDraft();
      setOpen(false);
      setStatus(`Offer added to ${branchName}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger render={<Button type="button" />}>
          Add offering
        </DialogTrigger>
        <DialogContent
          data-coms-ui="operational"
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Add offering</DialogTitle>
            <DialogDescription>
              Set a price for an active product at {branchName}. COMS stores the
              exact decimal value.
            </DialogDescription>
          </DialogHeader>
          {products.length > 0 ? (
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <BranchProductCreateFields
                products={products}
                productId={productId}
                price={price}
                pending={pending}
                onProductChange={setProductId}
                onPriceChange={setPrice}
              />
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
                <Button type="submit" disabled={pending}>
                  {pending ? "Adding…" : "Create offering"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              No active products are available to offer at this branch.
            </p>
          )}
          <BranchProductDiscardConfirmation
            title="Discard unsaved offering?"
            open={discardOpen}
            onOpenChange={setDiscardOpen}
            onDiscard={() => {
              clearDraft();
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
