import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { CatalogLoadError } from "@/features/catalogs/components/catalog-load-error";
import { InventoryManagement } from "@/features/inventory/components/inventory-management";
import { adjustInventoryAction } from "@/features/inventory/services/inventory-actions";
import { loadInventoryView } from "@/features/inventory/services/inventory-page-loader";

type InventorySearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: InventorySearchParams;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }

  const view = await loadInventoryView(session.user, await searchParams);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);
  if (view.status === "branch-options-error") {
    return (
      <AppPageShell user={session.user} title="Inventory">
        <CatalogLoadError title="branch inventory" />
      </AppPageShell>
    );
  }
  if (view.status === "inventory-error") {
    return (
      <AppPageShell user={session.user} title="Inventory">
        <CatalogLoadError title="inventory" />
      </AppPageShell>
    );
  }
  if (view.status === "branch-unavailable") {
    return (
      <AppPageShell user={session.user} title="Inventory">
        <InventoryManagement
          inventory={null}
          movements={null}
          scope="BRANCH"
          branchOptions={view.branchOptions}
          search={view.search}
          canAdjust={false}
          adjustAction={adjustInventoryAction}
          branchUnavailable
          branchUnavailableMessage={view.message}
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell user={session.user} title="Inventory">
      <InventoryManagement
        inventory={view.inventory}
        movements={view.movements}
        scope={view.scope}
        branchOptions={view.branchOptions}
        selectedBranchId={view.selectedBranchId}
        search={view.search}
        canAdjust={view.canAdjust}
        adjustAction={adjustInventoryAction}
        page={view.page}
      />
    </AppPageShell>
  );
}
