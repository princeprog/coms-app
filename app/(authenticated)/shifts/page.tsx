import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { loadShiftPageAccess } from "@/features/shifts/services/shift-page-loader";
import { ShiftDirectory } from "@/features/shifts/components/shift-directory";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const branch = (await searchParams).branch;
  const access = await loadShiftPageAccess(
    session.user,
    Array.isArray(branch) ? branch[0] : branch,
  );
  if (access.status === "forbidden") notFound();
  if (access.status === "session-expired") redirect("/");
  return (
    <AppPageShell user={session.user}>
      {access.status === "ready" ? (
        <ShiftDirectory
          key={access.selectedBranchId}
          branches={access.branches}
          branchId={access.selectedBranchId}
          canReview={access.canReview}
          currentUserId={access.currentUserId}
          superAdmin={access.superAdmin}
          canOperate={access.canOperate}
        />
      ) : access.status === "branch-unavailable" ? (
        <OperationalEmptyState
          title="No branch assigned"
          description="Ask an administrator to assign a branch before viewing shifts."
        />
      ) : (
        <CatalogLoadError title="branches" />
      )}
    </AppPageShell>
  );
}
