import { Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { formatProductPrice } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { SalesMenuPage } from "../types/sale.types";
import type { PosCartLine } from "./pos-cart-panel";

export function PosProductMenu({
  products,
  total,
  branchActive,
  pending,
  serviceType = null,
  cartIsFull,
  cart = [],
  onAdd,
  filtered = false,
}: {
  products: SalesMenuPage["items"];
  total: number;
  filtered?: boolean;
  branchActive: boolean;
  pending: boolean;
  serviceType?: "DINE_IN" | "TAKEAWAY" | null;
  cartIsFull: boolean;
  cart?: PosCartLine[];
  onAdd: (product: SalesMenuPage["items"][number]) => void;
}) {
  return (
    <section
      aria-labelledby="pos-menu-heading"
      className="flex min-w-0 flex-col gap-5"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 id="pos-menu-heading" className="text-xl font-semibold">
          Branch menu
        </h2>
        <p className="text-sm text-muted-foreground">
          {total} available {total === 1 ? "product" : "products"}
        </p>
      </div>
      {!serviceType && (
        <p className="text-sm text-muted-foreground">
          Choose a service type in Current order to add products.
        </p>
      )}
      {products.length === 0 ? (
        <OperationalEmptyState
          title={
            filtered
              ? "No products match your filters"
              : "No available products"
          }
          description={
            filtered
              ? "Clear the filters or choose another category."
              : "Ask Super Admin to update this branch’s menu."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const services = product.available_service_types ??
              product.service_types ?? ["DINE_IN", "TAKEAWAY"];
            const available =
              branchActive &&
              product.product_is_active &&
              product.is_available &&
              Boolean(serviceType && services.includes(serviceType));
            const selected = cart.find(
              (line) => line.product.product_id === product.product_id,
            );
            const disabled = !available || (cartIsFull && !selected) || pending;
            return (
              <article
                key={product.product_id}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4 transition-colors",
                  selected && "border-primary bg-primary/5",
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Utensils aria-hidden="true" className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <h3 className="font-semibold wrap-break-word">
                    {product.product_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {services
                      .map((s) => (s === "DINE_IN" ? "Dine-in" : "Takeout"))
                      .join(" · ") || "No eligible services"}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatProductPrice(product.price)}
                  </p>
                  {serviceType && !available && (
                    <p className="text-xs text-destructive">
                      Not available for this order
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  {selected && (
                    <Badge
                      variant="secondary"
                      className="max-w-24 overflow-hidden"
                    >
                      {selected.quantity} in order
                    </Badge>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    className="size-10 rounded-full"
                    disabled={disabled}
                    aria-label={`Add ${product.product_name}`}
                    onClick={() => onAdd(product)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {cartIsFull && (
        <p role="status" className="text-sm text-muted-foreground">
          The cart can contain up to 40 different products. Remove one to add
          another.
        </p>
      )}
    </section>
  );
}
