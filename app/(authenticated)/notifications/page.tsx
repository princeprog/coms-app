import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { NotificationInbox } from "@/features/notifications/components/notification-inbox";

export default async function NotificationsPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!session.user.role?.isActive) notFound();
  return (
    <AppPageShell user={session.user}>
      <NotificationInbox userId={session.user.id} />
    </AppPageShell>
  );
}
