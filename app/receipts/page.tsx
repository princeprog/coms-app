import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { SupplierReceiptManagement } from "@/features/supplier-receipts/components/supplier-receipt-management";
import { createSupplierReceiptAction } from "@/features/supplier-receipts/services/supplier-receipt-actions";
import { loadSupplierReceiptIndexView } from "@/features/supplier-receipts/services/supplier-receipt-page-loader";
import type { SupplierReceiptPageSearchParams } from "@/features/supplier-receipts/services/supplier-receipt-page-params";

export default async function SupplierReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<SupplierReceiptPageSearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const view = await loadSupplierReceiptIndexView(
    session.user,
    await searchParams,
  );
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);
  if (view.status === "list-error") {
    return (
      <AppPageShell user={session.user} title="Receiving">
        <CatalogLoadError title="supplier receipts" />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Receiving">
      <SupplierReceiptManagement
        page={view.page}
        search={view.search}
        statusFilter={view.statusFilter}
        canCreate={view.canCreate}
        formOptions={view.formOptions}
        formOptionsIssue={view.formOptionsIssue}
        createAction={createSupplierReceiptAction}
      />
    </AppPageShell>
  );
}
