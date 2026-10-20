import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { loadShiftPageAccess } from "@/features/shifts/services/shift-page-loader";
import { ShiftDetailView } from "@/features/shifts/components/shift-detail-view";

export default async function ShiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ shiftId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  const [{ shiftId }, query] = await Promise.all([params, searchParams]);
  const branch = Array.isArray(query.branch) ? query.branch[0] : query.branch;
  const access = await loadShiftPageAccess(session.user, branch);
  if (access.status === "forbidden") notFound();
  if (access.status === "session-expired") redirect("/");
  if (access.status !== "ready")
    return (
      <AppPageShell user={session.user}>
        <CatalogLoadError title="shift" />
      </AppPageShell>
    );
  // A branch outside the user's scope must not silently fall back to another branch.
  if (branch && access.selectedBranchId.toLowerCase() !== branch.toLowerCase())
    notFound();
  return (
    <AppPageShell user={session.user}>
      <ShiftDetailView
        branchId={access.selectedBranchId}
        shiftId={shiftId}
        currentUserId={access.currentUserId}
        canReview={access.canReview}
        superAdmin={access.superAdmin}
      />
    </AppPageShell>
  );
}
