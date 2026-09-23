import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { StockRequestManagement } from "@/features/stock-requests/components/stock-request-management";
import { createStockRequestAction } from "@/features/stock-requests/services/stock-request-actions";
import { loadStockRequestIndexView } from "@/features/stock-requests/services/stock-request-page-loader";
import type { StockRequestPageSearchParams } from "@/features/stock-requests/services/stock-request-page-params";

export default async function ReplenishmentPage({
  searchParams,
}: {
  searchParams: Promise<StockRequestPageSearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const view = await loadStockRequestIndexView(
    session.user,
    await searchParams,
  );
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);
  if (view.status === "list-error") {
    return (
      <AppPageShell user={session.user} title="Replenishment">
        <CatalogLoadError title="stock requests" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Replenishment">
      <StockRequestManagement
        page={view.page}
        filters={view.filters}
        branchOptions={view.branchOptions}
        canCreate={view.canCreate}
        formOptions={view.formOptions}
        formOptionsIssue={view.formOptionsIssue}
        createAction={createStockRequestAction}
      />
    </AppPageShell>
  );
}
