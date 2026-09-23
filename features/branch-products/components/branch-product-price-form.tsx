"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [price, setPrice] = useState(currentPrice);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditable = canUpdate && productIsActive;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !isEditable || price === currentPrice) return;
    const parsed = branchProductPriceSchema.safeParse({ price });
    if (!parsed.success) {
      setError("Enter a nonnegative decimal price.");
      setStatus("");
      return;
    }
    setError("");
    setStatus("");
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
      setStatus("Price saved.");
      router.refresh();
    });
  }

  if (!isEditable)
    return (
      <span className="tabular-nums" aria-label={`Price for ${productName}`}>
        {currentPrice}
      </span>
    );

  return (
    <form onSubmit={submit} className="flex min-w-48 flex-col gap-2">
      <Label className="sr-only" htmlFor={`offer-price-${productId}`}>
        Price for {productName}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={`offer-price-${productId}`}
          inputMode="decimal"
          autoComplete="off"
          maxLength={80}
          value={price}
          disabled={pending}
          onChange={(event) => setPrice(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `offer-price-error-${productId}` : undefined
          }
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending || price === currentPrice}
        >
          {pending ? "Saving…" : "Save price"}
        </Button>
      </div>
      {error && (
        <p
          id={`offer-price-error-${productId}`}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {status && (
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
      )}
    </form>
  );
}
