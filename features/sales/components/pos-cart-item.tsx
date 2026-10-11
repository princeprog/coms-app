import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatProductPrice } from "@/lib/format-currency";
import {
  addSaleDecimals,
  multiplySaleDecimals,
  subtractSaleDecimals,
} from "../services/sale-decimal";
import type { PosCartLine } from "./pos-cart-panel";

export function PosCartItem({
  line: { product, quantity },
  pending,
  onQuantityChange,
  onRemove,
}: {
  line: PosCartLine;
  pending: boolean;
  onQuantityChange: (id: string, quantity: string) => void;
  onRemove: (id: string) => void;
}) {
  const valid = /^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/.test(quantity);
  const reduced = valid ? subtractSaleDecimals(quantity, "1") : null;
  return (
    <li className="flex flex-col gap-2 border-b py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold wrap-break-word">
            {product.product_name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatProductPrice(product.price)} each
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {valid
            ? formatProductPrice(multiplySaleDecimals(quantity, product.price))
            : "—"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 xl:size-8"
            aria-label={`Decrease ${product.product_name}`}
            disabled={pending || !reduced || reduced === "0"}
            onClick={() => onQuantityChange(product.product_id, reduced!)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Input
            inputMode="decimal"
            aria-label={`Quantity for ${product.product_name}`}
            aria-invalid={!valid}
            value={quantity}
            maxLength={60}
            disabled={pending}
            className="h-11 w-16 xl:h-8 text-center tabular-nums"
            onChange={(event) =>
              onQuantityChange(product.product_id, event.target.value)
            }
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 xl:size-8"
            aria-label={`Increase ${product.product_name}`}
            disabled={pending}
            onClick={() =>
              onQuantityChange(
                product.product_id,
                valid ? addSaleDecimals([quantity, "1"]) : "1",
              )
            }
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 text-destructive xl:size-8"
          aria-label={`Remove ${product.product_name}`}
          disabled={pending}
          onClick={() => onRemove(product.product_id)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      {!valid && (
        <p className="text-sm text-destructive">
          Enter a positive decimal quantity.
        </p>
      )}
    </li>
  );
}
