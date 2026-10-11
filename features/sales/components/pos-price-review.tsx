import { Button } from "@/components/ui/button";
import type { BranchProduct } from "@/features/branch-products/types/branch-product.types";
import type { PosCartLine } from "./pos-cart-panel";
export function PosPriceReview({
  cart,
  updated,
  pending,
  onRefresh,
  onAccept,
}: {
  cart: PosCartLine[];
  updated: BranchProduct[] | null;
  pending: boolean;
  onRefresh: () => void;
  onAccept: () => void;
}) {
  return (
    <section
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-card p-4"
    >
      <h3 className="font-semibold">Review updated prices</h3>
      <p className="text-sm text-muted-foreground">
        Prices changed before this sale was recorded. Your cart quantities are
        preserved. Review and accept current prices before recording the sale
        again.
      </p>
      {updated && (
        <ul className="divide-y text-sm">
          {cart.map((line) => {
            const current = updated.find(
              (item) => item.product_id === line.product.product_id,
            );
            return (
              <li
                key={line.product.product_id}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <span>{line.product.product_name}</span>
                <span className="tabular-nums">
                  ₱{line.product.price} →{" "}
                  {current ? `₱${current.price}` : "Unavailable"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onRefresh}
        >
          {pending ? "Refreshing…" : "Refresh prices"}
        </Button>
        <Button type="button" disabled={pending || !updated} onClick={onAccept}>
          Accept updated prices
        </Button>
      </div>
    </section>
  );
}
