import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { productFields, productsEndpoint } from "@/features/products/constants";
import {
  createProductAction,
  deactivateProductAction,
  updateProductAction,
} from "@/features/products/services/product-actions";
import { getProductPageData } from "@/features/products/services/product-queries";
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

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!hasPermission(session.user, "products.read")) notFound();

  const params = await searchParams;
  const search = (first(params.search) ?? "").trim().slice(0, 160);
  const statusValue = first(params.is_active);
  const activeFilter =
    statusValue === "true" || statusValue === "false" ? statusValue : "all";
  let pageData;
  try {
    pageData = await getProductPageData({
      page: requestedPage(first(params.page)),
      search,
      active: activeFilter === "all" ? undefined : activeFilter === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user} title="Products">
        <CatalogLoadError title="Products" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Products">
      <CatalogManagement
        title="Products"
        resourceName="product"
        description="Maintain product definitions. Branch prices and recipes are managed separately."
        routePath={productsEndpoint}
        nameField="product_name"
        fields={productFields}
        page={pageData}
        search={search}
        activeFilter={activeFilter}
        canCreate={hasPermission(session.user, "products.create")}
        canUpdate={hasPermission(session.user, "products.update")}
        canDeactivate={hasPermission(session.user, "products.deactivate")}
        createAction={createProductAction}
        updateAction={updateProductAction}
        deactivateAction={deactivateProductAction}
      />
    </AppPageShell>
  );
}
