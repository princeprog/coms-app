"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  const [productId, setProductId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = branchProductCreateSchema.safeParse({
      product_id: productId,
      price,
    });
    if (!parsed.success) {
      setError("Select a product and enter a nonnegative decimal price.");
      setStatus("");
      return;
    }
    setError("");
    setStatus("");
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
      setProductId("");
      setPrice("");
      setStatus(`Offer added to ${branchName}.`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a product offer</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set the branch price as a decimal. COMS stores the exact value.
        </p>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            No active products are available to offer at this branch.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.5fr)_auto] sm:items-end"
          >
            <div className="grid gap-2">
              <Label htmlFor="branch-product-choice">Product to offer</Label>
              <NativeSelect
                id="branch-product-choice"
                value={productId}
                disabled={pending}
                onChange={(event) => setProductId(event.target.value)}
              >
                <NativeSelectOption value="">
                  Choose a product
                </NativeSelectOption>
                {products.map((product) => (
                  <NativeSelectOption key={product.id} value={product.id}>
                    {product.product_name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branch-product-price">Offer price</Label>
              <Input
                id="branch-product-price"
                inputMode="decimal"
                autoComplete="off"
                maxLength={80}
                value={price}
                disabled={pending}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="For example, 125.00"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add product offer"}
            </Button>
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive sm:col-span-3"
              >
                {error}
              </p>
            )}
            {status && (
              <p
                role="status"
                aria-live="polite"
                className="text-sm sm:col-span-3"
              >
                {status}
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
