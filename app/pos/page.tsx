import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { SalesManagement } from "@/features/sales/components/sales-management";
import {
  createSaleAction,
  voidSaleAction,
} from "@/features/sales/services/sales-actions";
import { loadSalesView } from "@/features/sales/services/sales-page-loader";
import type { SalesPageSearchParams } from "@/features/sales/services/sales-page-params";

function SalesPageUnavailable({ branches }: { branches: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {branches ? "Branches unavailable" : "Branch unavailable"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p role="alert" className="text-sm text-muted-foreground">
          {branches
            ? "COMS could not load your branch choices. Refresh this page to try again."
            : "No branch is assigned to your account. Ask an administrator to assign one before using Point of Sale."}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function PointOfSalePage({
  searchParams,
}: {
  searchParams: Promise<SalesPageSearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;

  const view = await loadSalesView(session.user, await searchParams);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);

  return (
    <AppPageShell user={session.user} title="Point of Sale">
      {view.status === "branch-options-error" ? (
        <SalesPageUnavailable branches />
      ) : view.status === "branch-unavailable" ? (
        <SalesPageUnavailable branches={false} />
      ) : (
        <SalesManagement
          view={view}
          createAction={createSaleAction}
          voidAction={voidSaleAction}
        />
      )}
    </AppPageShell>
  );
}
