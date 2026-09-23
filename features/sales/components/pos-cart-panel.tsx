import type { FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { multiplySaleDecimals } from "@/features/sales/services/sale-decimal";
import type { Sale, SalesMenuPage } from "@/features/sales/types/sale.types";

export type PosCartLine = {
  product: SalesMenuPage["items"][number];
  quantity: string;
};

const positiveQuantityPattern = /^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/;

export function PosCartPanel({
  cart,
  tenderMethod,
  branchActive,
  pending,
  error,
  lastSale,
  estimatedTotal,
  onTenderMethodChange,
  onQuantityChange,
  onRemove,
  onSubmit,
}: {
  cart: PosCartLine[];
  tenderMethod: string;
  branchActive: boolean;
  pending: boolean;
  error: string;
  lastSale: Sale | null;
  estimatedTotal: string | null;
  onTenderMethodChange: (value: string) => void;
  onQuantityChange: (productId: string, quantity: string) => void;
  onRemove: (productId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>
          <h2>Current order</h2>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          COMS records the tender method only; it does not process payment.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          aria-label="POS checkout"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="pos-tender-method" className="text-sm font-medium">
              Tender method
            </label>
            <Input
              id="pos-tender-method"
              value={tenderMethod}
              onChange={(event) => onTenderMethodChange(event.target.value)}
              maxLength={40}
              disabled={pending}
              required
            />
          </div>
          {cart.length === 0 ? (
            <p className="rounded-3xl border border-dashed p-4 text-sm text-muted-foreground">
              Add products to begin a sale.
            </p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Cart items">
              {cart.map(({ product, quantity }) => {
                const validQuantity = positiveQuantityPattern.test(quantity);
                return (
                  <li
                    key={product.product_id}
                    className="grid gap-2 rounded-3xl border p-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {product.product_name}
                      </p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {validQuantity
                          ? `Line estimate: ${multiplySaleDecimals(quantity, product.price)}`
                          : "Enter a positive decimal quantity."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`pos-quantity-${product.product_id}`}
                        className="text-xs font-medium"
                      >
                        Quantity
                      </label>
                      <Input
                        id={`pos-quantity-${product.product_id}`}
                        inputMode="decimal"
                        value={quantity}
                        onChange={(event) =>
                          onQuantityChange(
                            product.product_id,
                            event.target.value,
                          )
                        }
                        aria-label={`Quantity for ${product.product_name}`}
                        maxLength={60}
                        disabled={pending}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Remove ${product.product_name}`}
                      disabled={pending}
                      onClick={() => onRemove(product.product_id)}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-medium">Estimated total</span>
            <output
              aria-label="Estimated total"
              className="font-semibold tabular-nums"
            >
              {estimatedTotal ?? "Check quantities"}
            </output>
          </div>
          <p className="text-xs text-muted-foreground">
            Final price and stock are confirmed by COMS.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {lastSale && (
            <p role="status" className="text-sm">
              {lastSale.status === "VOIDED"
                ? "This retry matched a sale that has already been voided."
                : `Sale recorded. Confirmed total: ${lastSale.total_amount}`}
            </p>
          )}
          <Button
            type="submit"
            disabled={!branchActive || pending || cart.length === 0}
          >
            {pending ? "Recording sale…" : "Record sale"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
