import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  supplierFields,
  suppliersEndpoint,
} from "@/features/suppliers/constants";
import {
  createSupplierAction,
  deactivateSupplierAction,
  updateSupplierAction,
} from "@/features/suppliers/services/supplier-actions";
import { getSupplierPageData } from "@/features/suppliers/services/supplier-queries";
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

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/suppliers">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!hasPermission(session.user, "suppliers.read")) notFound();

  const params = await searchParams;
  const search = (first(params.search) ?? "").trim().slice(0, 160);
  const statusValue = first(params.is_active);
  const activeFilter =
    statusValue === "true" || statusValue === "false" ? statusValue : "all";
  let pageData;
  try {
    pageData = await getSupplierPageData({
      page: requestedPage(first(params.page)),
      search,
      active: activeFilter === "all" ? undefined : activeFilter === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user} title="Suppliers">
        <CatalogLoadError title="Suppliers" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Suppliers">
      <CatalogManagement
        title="Suppliers"
        resourceName="supplier"
        description="Maintain supplier contact details for commissary receiving."
        routePath={suppliersEndpoint}
        nameField="supplier_name"
        fields={supplierFields}
        page={pageData}
        search={search}
        activeFilter={activeFilter}
        canCreate={hasPermission(session.user, "suppliers.create")}
        canUpdate={hasPermission(session.user, "suppliers.update")}
        canDeactivate={hasPermission(session.user, "suppliers.deactivate")}
        createAction={createSupplierAction}
        updateAction={updateSupplierAction}
        deactivateAction={deactivateSupplierAction}
      />
    </AppPageShell>
  );
}
