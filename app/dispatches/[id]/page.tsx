import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { DispatchDetailView } from "@/features/dispatches/components/dispatch-detail-view";
import { loadDispatchDetailView } from "@/features/dispatches/services/dispatch-page-loader";

export default async function DispatchDetailPage({
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
  const view = await loadDispatchDetailView(session.user, id);
  if (view.status === "forbidden" || view.status === "not-found") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "detail-error") {
    return (
      <AppPageShell user={session.user} title="Dispatches">
        <CatalogLoadError title="dispatch details" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Dispatches">
      <DispatchDetailView dispatch={view.dispatch} />
    </AppPageShell>
  );
}
