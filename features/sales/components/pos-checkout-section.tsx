import { MenuListControls } from "@/features/menus/components/menu-list-controls";
import type { SalesViewResult } from "../services/sales-page-loader";
import type { SaleCreateAction } from "../types/sale.types";
import { PosCheckout } from "./pos-checkout";
import { SalesPageLink } from "./sales-page-link";

export function PosCheckoutSection({
  view,
  createAction,
}: {
  view: Extract<SalesViewResult, { status: "ready" }>;
  createAction: SaleCreateAction;
}) {
  if (!view.menuPage || !view.canCreate) return null;
  const { selectedBranch, filters } = view;
  const pages = Math.max(
    1,
    Math.ceil(view.menuPage.total / view.menuPage.page_size),
  );
  return (
    <PosCheckout
      key={selectedBranch.id}
      branchId={selectedBranch.id}
      serviceTypes={selectedBranch.serviceTypes}
      appliedService={filters.serviceType}
      branchActive={selectedBranch.status !== "inactive"}
      menuPage={view.menuPage}
      action={createAction}
      menuControls={
        <MenuListControls
          route="/pos"
          search={filters.search}
          searchLabel="Search products"
          searchPlaceholder="Find a product…"
          preserveKeys={["service_type", "view"]}
        />
      }
      menuPagination={
        pages > 1 && (
          <nav
            aria-label="POS menu pages"
            className="flex flex-wrap justify-between gap-3"
          >
            {filters.page > 1 ? (
              <SalesPageLink
                filters={{ ...filters, page: filters.page - 1 }}
                label="Previous menu page"
              />
            ) : (
              <span />
            )}
            <span className="self-center text-sm text-muted-foreground">
              Page {filters.page} of {pages}
            </span>
            {filters.page < pages && (
              <SalesPageLink
                filters={{ ...filters, page: filters.page + 1 }}
                label="Next menu page"
              />
            )}
          </nav>
        )
      }
    />
  );
}
