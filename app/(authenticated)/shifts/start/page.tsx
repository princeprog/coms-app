import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { StartShiftView } from "@/features/shifts/components/start-shift-view";
import { loadShiftPageAccess } from "@/features/shifts/services/shift-page-loader";
import { safeReturnPath } from "@/features/shifts/services/shift-paths";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function StartShiftPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const params = await searchParams;
  const access = await loadShiftPageAccess(session.user, first(params.branch));
  if (
    access.status === "forbidden" ||
    (access.status === "ready" && !access.canOperate)
  )
    notFound();
  if (access.status === "session-expired") redirect("/");
  return (
    <AppPageShell user={session.user}>
      {access.status === "ready" ? (
        <StartShiftView
          branches={access.branches}
          defaultBranchId={access.selectedBranchId}
          returnTo={safeReturnPath(first(params.return), "") || undefined}
        />
      ) : access.status === "branch-unavailable" ? (
        <OperationalEmptyState
          title="No branch assigned"
          description="Ask an administrator to assign a branch before starting a shift."
        />
      ) : (
        <CatalogLoadError title="branches" />
      )}
    </AppPageShell>
  );
}
