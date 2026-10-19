import type { ReactNode } from "react";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { SalesMenuPage } from "../types/sale.types";
import type { PosCartLine } from "./pos-cart-panel";
import { PosProductMenu } from "./pos-product-menu";

export function PosMenuPanel({
  menuPage,
  menuControls,
  menuPagination,
  refreshing,
  filtered,
  unavailable,
  branchActive,
  pending,
  service,
  cart,
  onAdd,
}: {
  menuPage: SalesMenuPage;
  menuControls?: ReactNode;
  menuPagination?: ReactNode;
  refreshing: boolean;
  filtered: boolean;
  unavailable: boolean;
  branchActive: boolean;
  pending: boolean;
  service: ServiceType | null;
  cart: PosCartLine[];
  onAdd: (product: SalesMenuPage["items"][number]) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {menuControls}
      <div
        aria-busy={refreshing}
        className={refreshing ? "opacity-60" : undefined}
      >
        {!unavailable && (
          <PosProductMenu
            products={menuPage.items}
            total={menuPage.total}
            branchActive={branchActive}
            pending={pending || refreshing}
            filtered={filtered}
            serviceType={service}
            cartIsFull={cart.length >= 40}
            cart={cart}
            onAdd={onAdd}
          />
        )}
      </div>
      {menuPagination}
    </div>
  );
}
