import { OperationalStatusBadge } from "@/components/shared/operational-page-ui";
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
      <TableCell className="min-w-56 whitespace-normal">
        <p className="font-medium">{offer.product_name}</p>
        {offer.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {offer.description}
          </p>
        )}
      </TableCell>
      <TableCell className="min-w-32 text-right font-medium tabular-nums">
        {offer.price}
      </TableCell>
      <TableCell className="min-w-36">
        <OperationalStatusBadge
          variant={offer.is_available ? "secondary" : "outline"}
        >
          {offer.is_available ? "Available" : "Not available"}
        </OperationalStatusBadge>
      </TableCell>
      <TableCell className="min-w-36">
        <OperationalStatusBadge
          variant={offer.product_is_active ? "secondary" : "outline"}
        >
          {offer.product_is_active ? "Active product" : "Inactive product"}
        </OperationalStatusBadge>
      </TableCell>
      <TableCell className="min-w-48 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <BranchProductPriceForm
            branchId={offer.branch_id}
            productId={offer.product_id}
            productName={offer.product_name}
            currentPrice={offer.price}
            productIsActive={offer.product_is_active}
            canUpdate={canUpdatePrice}
            action={priceAction}
          />
          <BranchProductAvailabilityForm
            branchId={offer.branch_id}
            productId={offer.product_id}
            productName={offer.product_name}
            isAvailable={offer.is_available}
            productIsActive={offer.product_is_active}
            canUpdate={canUpdateAvailability}
            action={availabilityAction}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
