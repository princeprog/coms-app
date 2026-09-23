import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesMenuPage } from "@/features/sales/types/sale.types";

export function PosProductMenu({
  products,
  total,
  branchActive,
  pending,
  cartIsFull,
  onAdd,
}: {
  products: SalesMenuPage["items"];
  total: number;
  branchActive: boolean;
  pending: boolean;
  cartIsFull: boolean;
  onAdd: (product: SalesMenuPage["items"][number]) => void;
}) {
  return (
    <section aria-labelledby="pos-menu-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="pos-menu-heading" className="text-lg font-semibold">
            Available products
          </h2>
          <p className="text-sm text-muted-foreground">
            Prices come from this branch&apos;s active product offers.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{total} available</p>
      </div>
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">No available products on this page.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Search for another product or ask a manager to configure an active
              branch offer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const disabled =
              !branchActive ||
              !product.product_is_active ||
              !product.is_available ||
              cartIsFull ||
              pending;
            return (
              <Card key={product.product_id}>
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">
                    {product.product_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {product.description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="font-medium tabular-nums">
                    Price: {product.price}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={disabled}
                    aria-label={`Add ${product.product_name}`}
                    onClick={() => onAdd(product)}
                  >
                    Add
                  </Button>
                </CardContent>
              </Card>
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
