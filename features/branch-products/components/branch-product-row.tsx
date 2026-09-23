import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { BranchProductAvailabilityForm } from "@/features/branch-products/components/branch-product-availability-form";
import { BranchProductPriceForm } from "@/features/branch-products/components/branch-product-price-form";
import type {
  BranchProduct,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";

export function BranchProductRow({
  offer,
  canUpdatePrice,
  canUpdateAvailability,
  priceAction,
  availabilityAction,
}: {
  offer: BranchProduct;
  canUpdatePrice: boolean;
  canUpdateAvailability: boolean;
  priceAction: BranchProductOperationAction;
  availabilityAction: BranchProductOperationAction;
}) {
  return (
    <TableRow>
      <TableCell className="min-w-48">
        <p className="font-medium">{offer.product_name}</p>
        {offer.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {offer.description}
          </p>
        )}
        {!offer.product_is_active && (
          <Badge variant="outline" className="mt-2">
            Inactive product
          </Badge>
        )}
      </TableCell>
      <TableCell className="min-w-72">
        <BranchProductPriceForm
          branchId={offer.branch_id}
          productId={offer.product_id}
          productName={offer.product_name}
          currentPrice={offer.price}
          productIsActive={offer.product_is_active}
          canUpdate={canUpdatePrice}
          action={priceAction}
        />
      </TableCell>
      <TableCell className="min-w-56">
        <BranchProductAvailabilityForm
          branchId={offer.branch_id}
          productId={offer.product_id}
          productName={offer.product_name}
          isAvailable={offer.is_available}
          productIsActive={offer.product_is_active}
          canUpdate={canUpdateAvailability}
          action={availabilityAction}
        />
      </TableCell>
    </TableRow>
  );
}
