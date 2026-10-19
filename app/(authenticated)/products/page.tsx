import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { createCatalogHref } from "@/features/catalogs/services/catalog-page-params";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import {
  productDisplayColumns,
  productFields,
  productsEndpoint,
} from "@/features/products/constants";
import {
  createProductAction,
  deactivateProductAction,
  updateProductAction,
} from "@/features/products/services/product-actions";
import { getProductPageData } from "@/features/products/services/product-queries";
import { parseTablePageSize } from "@/lib/table-pagination";
import { ApiRequestError } from "@/services/api-services";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
  const pageSize = parseTablePageSize(params.page_size);
  const statusValue = first(params.is_active);
  const activeFilter =
    statusValue === "true" || statusValue === "false" ? statusValue : "all";
  let pageData;
  try {
    pageData = await getProductPageData({
      page: requestedPage(first(params.page)),
      search,
      pageSize,
      active: activeFilter === "all" ? undefined : activeFilter === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user}>
        <CatalogLoadError title="Products" />
      </AppPageShell>
    );
  }

  const pageCount = Math.max(1, Math.ceil(pageData.total / pageData.page_size));
  if (pageData.page > pageCount)
    redirect(
      createCatalogHref(productsEndpoint, {
        page: pageCount,
        pageSize,
        search,
        active: activeFilter,
      }),
    );

  return (
    <AppPageShell user={session.user}>
      <CatalogManagement
        title="Products"
        directoryLayout
        detailsPath="/products"
        setupEnabled
        resourceName="product"
        description=""
        directoryDescription=""
        secondaryActions={
          isProtectedSuperAdmin(session.user) ? (
            <Link
              href="/products/categories"
              className={buttonVariants({ variant: "outline" })}
            >
              Manage categories
            </Link>
          ) : undefined
        }
        routePath={productsEndpoint}
        displayColumns={productDisplayColumns}
        fields={productFields}
        page={pageData}
        search={search}
        activeFilter={activeFilter}
        canCreate={isProtectedSuperAdmin(session.user)}
        canUpdate={isProtectedSuperAdmin(session.user)}
        canDeactivate={isProtectedSuperAdmin(session.user)}
        createAction={createProductAction}
        updateAction={updateProductAction}
        deactivateAction={deactivateProductAction}
      />
    </AppPageShell>
  );
}
