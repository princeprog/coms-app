import { paymentMethodsEndpoint } from "@/features/payment-methods/constants";
import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { createCatalogHref } from "@/features/catalogs/services/catalog-page-params";
import { CatalogManagement } from "@/features/catalogs/components/catalog-management";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  paymentMethodDisplayColumns,
  paymentMethodFields,
} from "@/features/payment-methods/fields";
import {
  createPaymentMethodAction,
  deactivatePaymentMethodAction,
  updatePaymentMethodAction,
} from "@/features/payment-methods/services/payment-method-actions";
import { getPaymentMethodPageData } from "@/features/payment-methods/services/payment-method-queries";
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

export default async function PaymentMethodsPage({
  searchParams,
}: PageProps<"/payment-methods">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!isProtectedSuperAdmin(session.user)) notFound();

  const params = await searchParams;
  const search = (first(params.search) ?? "").trim().slice(0, 100);
  const statusValue = first(params.is_active);
  const activeFilter =
    statusValue === "true" || statusValue === "false" ? statusValue : "all";
  let pageData;
  try {
    pageData = await getPaymentMethodPageData({
      page: requestedPage(first(params.page)),
      search,
      active: activeFilter === "all" ? undefined : activeFilter === "true",
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return (
      <AppPageShell user={session.user}>
        <CatalogLoadError title="Payment methods" />
      </AppPageShell>
    );
  }

  const pageCount = Math.max(1, Math.ceil(pageData.total / pageData.page_size));
  if (pageData.page > pageCount)
    redirect(
      createCatalogHref(paymentMethodsEndpoint, {
        page: pageCount,
        search,
        active: activeFilter,
      }),
    );

  return (
    <AppPageShell user={session.user}>
      <CatalogManagement
        directoryLayout
        directoryTitle="Accepted payment methods"
        directoryDescription="Methods available at checkout, listed A–Z. Inactive methods remain in sales history."
        title="Payment methods"
        resourceName="payment method"
        description="Manage payment methods accepted across all branches. Cash calculates change; non-cash records the selected method. Edit an inactive method to reactivate it."
        routePath={paymentMethodsEndpoint}
        displayColumns={paymentMethodDisplayColumns}
        fields={paymentMethodFields}
        page={pageData}
        search={search}
        activeFilter={activeFilter}
        canCreate={true}
        canUpdate={true}
        canDeactivate={true}
        createAction={createPaymentMethodAction}
        updateAction={updatePaymentMethodAction}
        deactivateAction={deactivatePaymentMethodAction}
      />
    </AppPageShell>
  );
}
