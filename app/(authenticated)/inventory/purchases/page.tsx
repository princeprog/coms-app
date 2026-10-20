import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { hasPermission } from "@/features/auth/permissions";
import { PurchaseHistory } from "@/features/direct-purchases/components/purchase-history";
export default async function PurchasesPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!hasPermission(session.user, "supplier_receipts.read")) notFound();
  return (
    <AppPageShell user={session.user}>
      <PurchaseHistory
        canCreate={
          hasPermission(session.user, "supplier_receipts.create") &&
          (hasPermission(session.user, "stock_items.read") ||
            hasPermission(session.user, "inventory.commissary_read"))
        }
      />
    </AppPageShell>
  );
}
