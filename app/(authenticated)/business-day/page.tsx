import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { BusinessDaySettings } from "@/features/business-day/components/business-day-settings";
import { getBusinessDay } from "@/features/business-day/services/business-day-queries";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";

export default async function BusinessDayPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!isProtectedSuperAdmin(session.user)) notFound();
  let settings;
  try {
    settings = await getBusinessDay();
  } catch {
    return (
      <AppPageShell user={session.user}>
        <CatalogLoadError title="Business day" />
      </AppPageShell>
    );
  }
  return (
    <AppPageShell user={session.user}>
      <BusinessDaySettings initial={settings} />
    </AppPageShell>
  );
}
