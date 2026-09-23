import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  stockItemFields,
  stockItemsEndpoint,
} from "@/features/stock-items/constants";
import {
  createStockItemAction,
  deactivateStockItemAction,
  updateStockItemAction,
} from "@/features/stock-items/services/stock-item-actions";
import { getStockItemPageData } from "@/features/stock-items/services/stock-item-queries";
import { ApiRequestError } from "@/services/api-services";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function requestedPage(value: string | undefined) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 1_000_000
    ? number
    : 1;
}

export default async function StockItemsPage({
  searchParams,
}: PageProps<"/stock-items">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!hasPermission(session.user, "stock_items.read")) notFound();

  const params = await searchParams;
  const search = (first(params.search) ?? "").trim().slice(0, 160);
  const statusValue = first(params.is_active);
  const activeFilter =
    statusValue === "true" || statusValue === "false" ? statusValue : "all";
  let pageData;
  try {
    pageData = await getStockItemPageData({
      page: requestedPage(first(params.page)),
      search,
      active: activeFilter === "all" ? undefined : activeFilter === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user} title="Stock Items">
        <CatalogLoadError title="Stock Items" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Stock Items">
      <CatalogManagement
        title="Stock Items"
        resourceName="stock item"
        description="Maintain stock-item names, categories, and units for receiving and inventory."
        routePath={stockItemsEndpoint}
        nameField="stock_item_name"
        fields={stockItemFields}
        page={pageData}
        search={search}
        activeFilter={activeFilter}
        canCreate={hasPermission(session.user, "stock_items.create")}
        canUpdate={hasPermission(session.user, "stock_items.update")}
        canDeactivate={hasPermission(session.user, "stock_items.deactivate")}
        createAction={createStockItemAction}
        updateAction={updateStockItemAction}
        deactivateAction={deactivateStockItemAction}
      />
    </AppPageShell>
  );
}
