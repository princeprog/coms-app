import { MenuRowActions } from "@/features/menus/components/menu-row-actions";
import { MenuStatusBadge } from "@/features/menus/components/menu-status-badge";
import { ShoppingBag, Utensils } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import type {
  BranchProduct,
  BranchProductOperationAction,
} from "@/features/branch-products/types/branch-product.types";

export function BranchProductRow({
  offer,
  canManage,
  availabilityAction,
}: {
  offer: BranchProduct;
  canManage: boolean;
  availabilityAction: BranchProductOperationAction;
}) {
  const services = offer.available_service_types ??
    offer.service_types ?? ["DINE_IN", "TAKEAWAY"];
  const [whole, fraction = ""] = offer.price.split(".");
  const price = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.replace(/0+$/, "").padEnd(2, "0")}`;
  const blockedReason =
    offer.blocked_reason ??
    (services.length === 0 ? "Unsupported service" : null);

  return (
    <TableRow>
      <TableCell className="w-2/5 min-w-64 whitespace-normal">
        <p className="font-semibold">{offer.product_name}</p>
        {offer.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {offer.description}
          </p>
        )}
        {blockedReason && blockedReason !== "Inactive product" && (
          <p className="mt-1 text-sm text-destructive">{blockedReason}</p>
        )}
      </TableCell>
      <TableCell className="min-w-32 text-right font-medium tabular-nums">
        ₱{price}
      </TableCell>
      <TableCell className="min-w-56">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {services.map((service, index) => {
            const Icon = service === "DINE_IN" ? Utensils : ShoppingBag;
            return (
              <span key={service} className="inline-flex items-center gap-2">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mr-1 text-muted-foreground"
                  >
                    ·
                  </span>
                )}
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {service === "DINE_IN" ? "Dine-in" : "Takeout"}
              </span>
            );
          })}
          {!services.length && (
            <span className="text-sm text-muted-foreground">
              No eligible services
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="min-w-28">
        <MenuStatusBadge
          status={offer.product_is_active ? "active" : "inactive"}
          className="rounded-md py-1 text-sm"
        >
          {offer.product_is_active ? "Active" : "Inactive"}
        </MenuStatusBadge>
      </TableCell>
      <TableCell className="min-w-36">
        <MenuStatusBadge
          status={offer.is_available ? "active" : "unavailable"}
          className="rounded-md py-1 text-sm"
        >
          {offer.is_available ? "Available" : "Unavailable"}
        </MenuStatusBadge>
      </TableCell>
      {canManage && (
        <TableCell className="w-16 text-right">
          <MenuRowActions
            offer={offer}
            canEditProduct={canManage}
            canAvailability={canManage}
            canServices={canManage}
            availabilityAction={availabilityAction}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
