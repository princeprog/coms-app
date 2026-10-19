import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import {
  createCatalogHref,
  type CatalogDirectoryFilters,
} from "@/features/catalogs/services/catalog-page-params";
import { CategoryManagement } from "@/features/product-categories/components/category-management";
import { getProductCategories } from "@/features/product-categories/services/product-category-queries";
import { parseTablePageSize } from "@/lib/table-pagination";
import { ApiRequestError } from "@/services/api-services";

export default async function ProductCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!isProtectedSuperAdmin(session.user)) notFound();
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const pageNumber = Number(first(params.page));
  const status = first(params.is_active);
  const filters: CatalogDirectoryFilters & { pageSize: number } = {
    page:
      Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= 1_000_000
        ? pageNumber
        : 1,
    pageSize: parseTablePageSize(params.page_size),
    search: (first(params.search) ?? "").trim().slice(0, 80),
    active: status === "true" || status === "false" ? status : ("all" as const),
  };
  let page;
  try {
    page = await getProductCategories({
      page: filters.page,
      page_size: filters.pageSize,
      search: filters.search,
      is_active:
        filters.active === "all" ? undefined : filters.active === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user}>
        <CatalogLoadError title="Product categories" />
      </AppPageShell>
    );
  }
  const count = Math.max(1, Math.ceil(page.total / page.page_size));
  if (page.page > count)
    redirect(
      createCatalogHref("/products/categories", { ...filters, page: count }),
    );
  return (
    <AppPageShell user={session.user}>
      <CategoryManagement page={page} filters={filters} />
    </AppPageShell>
  );
}
