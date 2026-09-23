"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const [isAvailable, setIsAvailable] = useState(savedAvailability);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !canUpdate || isAvailable === savedAvailability) return;
    const parsed = branchProductAvailabilitySchema.safeParse({
      is_available: isAvailable,
    });
    if (!parsed.success) {
      setError("Choose whether this product is available for sale.");
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
      setStatus("Availability saved.");
      router.refresh();
    });
  }

  if (!canUpdate)
    return <span>{savedAvailability ? "Available" : "Not available"}</span>;

  const checkboxDisabled = pending || (!productIsActive && !isAvailable);
  return (
    <form onSubmit={submit} className="flex min-w-48 flex-col gap-2">
      <label className="flex min-h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAvailable}
          disabled={checkboxDisabled}
          onChange={(event) => {
            setIsAvailable(event.target.checked);
            setError("");
            setStatus("");
          }}
          aria-label={`Available for sale for ${productName}`}
          aria-describedby={
            !productIsActive
              ? `offer-availability-note-${productId}`
              : undefined
          }
          className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        {isAvailable ? "Available for sale" : "Not available for sale"}
      </label>
      {!productIsActive && (
        <p
          id={`offer-availability-note-${productId}`}
          className="text-xs text-muted-foreground"
        >
          Inactive products cannot be made available.
        </p>
      )}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending || isAvailable === savedAvailability}
      >
        {pending ? "Saving…" : "Save availability"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
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
