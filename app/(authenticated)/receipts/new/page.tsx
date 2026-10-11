import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { SupplierReceiptCreatePage } from "@/features/supplier-receipts/components/supplier-receipt-create-page";
import { createSupplierReceiptAction } from "@/features/supplier-receipts/services/supplier-receipt-actions";
import { loadSupplierReceiptCreateView } from "@/features/supplier-receipts/services/supplier-receipt-page-loader";

export default async function NewSupplierReceiptPage() {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const view = await loadSupplierReceiptCreateView(session.user);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "unavailable") {
    return (
      <AppPageShell user={session.user}>
        <OperationalLoadError
          title="supplier delivery form"
          description="COMS could not load active suppliers and stock items. Refresh to try again."
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user}>
      <SupplierReceiptCreatePage
        suppliers={view.formOptions.suppliers}
        stockItems={view.formOptions.stockItems}
        action={createSupplierReceiptAction}
      />
    </AppPageShell>
  );
}
