import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { OfflineManagerPage } from "@/features/pos-offline/components/offline-manager-page";

export default async function BranchOfflinePosPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const branch = z.uuid().safeParse((await params).branchId);
  if (!branch.success) notFound();
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!hasBranchScope(session.user, branch.data)) notFound();
  const canManageDevices = hasPermission(
    session.user,
    "pos_offline.devices_manage",
  );
  const canReview = hasPermission(session.user, "pos_offline.review");
  if (!canManageDevices && !canReview) notFound();
  return (
    <AppPageShell user={session.user}>
      <OfflineManagerPage
        branchId={branch.data}
        canManageDevices={canManageDevices}
        canReview={canReview}
      />
    </AppPageShell>
  );
}
