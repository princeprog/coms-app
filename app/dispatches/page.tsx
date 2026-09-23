import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { DispatchManagement } from "@/features/dispatches/components/dispatch-management";
import { loadDispatchIndexView } from "@/features/dispatches/services/dispatch-page-loader";
import type { DispatchPageSearchParams } from "@/features/dispatches/services/dispatch-page-params";

export default async function DispatchesPage({
  searchParams,
}: {
  searchParams: Promise<DispatchPageSearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const view = await loadDispatchIndexView(session.user, await searchParams);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);
  if (view.status === "list-error") {
    return (
      <AppPageShell user={session.user} title="Dispatches">
        <CatalogLoadError title="dispatches" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Dispatches">
      <DispatchManagement
        page={view.page}
        filters={view.filters}
        canCreate={view.canCreate}
      />
    </AppPageShell>
  );
}
