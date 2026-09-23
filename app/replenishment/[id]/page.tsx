import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { StockRequestDetailView } from "@/features/stock-requests/components/stock-request-detail-view";
import { transitionStockRequestAction } from "@/features/stock-requests/services/stock-request-actions";
import { loadStockRequestDetailView } from "@/features/stock-requests/services/stock-request-page-loader";

export default async function ReplenishmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const { id } = await params;
  const view = await loadStockRequestDetailView(session.user, id);
  if (view.status === "forbidden" || view.status === "not-found") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "detail-error") {
    return (
      <AppPageShell user={session.user} title="Replenishment">
        <CatalogLoadError title="stock request" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Replenishment">
      <StockRequestDetailView
        request={view.request}
        canApprove={view.canApprove}
        canReject={view.canReject}
        canCancel={view.canCancel}
        transitionAction={transitionStockRequestAction}
      />
    </AppPageShell>
  );
}
