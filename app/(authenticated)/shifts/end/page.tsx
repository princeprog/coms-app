import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import {
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { EndShiftView } from "@/features/shifts/components/end-shift-view";

export default async function EndShiftPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (
    !hasPermission(session.user, "shifts.operate") ||
    isProtectedSuperAdmin(session.user)
  )
    notFound();
  return (
    <AppPageShell user={session.user}>
      <EndShiftView />
    </AppPageShell>
  );
}
