import type { FormEventHandler, ReactNode } from "react";
import { ArrowRight, LoaderCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProductPrice } from "@/lib/format-currency";
import { addSaleDecimals } from "../services/sale-decimal";
import { calculateCashChange } from "../services/pos-cash";
import type { Sale, SalesMenuPage } from "../types/sale.types";
import { PosCashPayment } from "./pos-cash-payment";
import { PosClearOrder } from "./pos-clear-order";
import { PosCartItem } from "./pos-cart-item";
import { PosSaleCompleted } from "./pos-sale-completed";

export type PosCartLine = {
  product: SalesMenuPage["items"][number];
  quantity: string;
};

export function PosCartPanel({
  cart,
  cash,
  paymentPicker,
  branchActive,
  blocked = false,
  pending,
  error,
  lastSale,
  estimatedTotal,
  amountReceived,
  onAmountChange,
  onQuantityChange,
  onRemove,
  onClear,
  onSubmit,
  servicePicker,
}: {
  cart: PosCartLine[];
  cash: boolean;
  paymentPicker: ReactNode;
  branchActive: boolean;
  blocked?: boolean;
  pending: boolean;
  error: string;
  lastSale: Sale | null;
  estimatedTotal: string | null;
  amountReceived: string;
  onAmountChange: (value: string) => void;
  onQuantityChange: (productId: string, quantity: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  servicePicker: ReactNode;
}) {
  const completed = cart.length === 0 && lastSale?.status === "COMPLETED";
  const total = estimatedTotal;
  const cashValid =
    !cash || calculateCashChange(amountReceived, total).change !== null;
  const validQuantities = cart.every(({ quantity }) =>
    /^(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)$/.test(quantity),
  );
  const count = validQuantities
    ? addSaleDecimals(cart.map(({ quantity }) => quantity))
    : "—";
  if (completed) {
    return (
      <PosSaleCompleted
        sale={lastSale}
        cash={cash}
        amountReceived={amountReceived}
        onNewSale={onClear}
      />
    );
  }
  return (
    <section
      id="pos-cart-panel"
      aria-labelledby="pos-order-heading"
      className="flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 xl:sticky xl:top-4 xl:h-fit xl:rounded-none xl:border-0 xl:border-l xl:py-0 xl:pr-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h2
            id="pos-order-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            Current order
          </h2>
          <span className="text-sm text-muted-foreground">
            {count} {count === "1" ? "item" : "items"}
          </span>
        </div>
        <PosClearOrder disabled={pending || !cart.length} onClear={onClear} />
      </header>
      {servicePicker}
      <form
        className="flex flex-col gap-4"
        aria-label="POS checkout"
        aria-busy={pending}
        onSubmit={onSubmit}
      >
        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <ShoppingBag aria-hidden="true" className="size-7" />
            <p className="text-sm">Add products to begin a sale.</p>
          </div>
        ) : (
          <ul
            aria-label="Cart items"
            className="flex max-h-80 flex-col overflow-y-auto"
          >
            {cart.map((line) => (
              <PosCartItem
                key={line.product.product_id}
                line={line}
                pending={pending}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <span className="text-lg font-semibold">Total to pay</span>
          <output
            aria-label="Estimated total"
            className="break-all text-3xl font-semibold tracking-tight tabular-nums"
          >
            {total !== null
              ? formatProductPrice(total)
              : "Check the order details"}
          </output>
        </div>
        {paymentPicker}
        {cash && (
          <PosCashPayment
            amount={lastSale?.status === "VOIDED" ? "" : amountReceived}
            total={total}
            disabled={pending || !cart.length}
            onChange={onAmountChange}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {lastSale?.status === "VOIDED" && (
          <p role="status" className="text-sm font-medium">
            This retry matched a sale that has already been voided.
          </p>
        )}
        {pending && (
          <p role="status" className="sr-only">
            Completing sale…
          </p>
        )}
        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={
            !branchActive ||
            blocked ||
            pending ||
            !cart.length ||
            estimatedTotal === null ||
            !cashValid
          }
        >
          {pending ? "Completing sale…" : "Complete sale"}
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              data-icon="inline-end"
              className="motion-safe:animate-spin"
            />
          ) : (
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          )}
        </Button>
      </form>
    </section>
  );
}
