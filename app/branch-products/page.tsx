import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { BranchProductsManagement } from "@/features/branch-products/components/branch-products-management";
import {
  createBranchProductAction,
  updateBranchProductAvailabilityAction,
  updateBranchProductPriceAction,
} from "@/features/branch-products/services/branch-product-actions";
import {
  loadBranchProductsView,
  type BranchProductsViewResult,
} from "@/features/branch-products/services/branch-product-page-loader";

type SearchParams = Record<string, string | string[] | undefined>;

function BranchOptionsError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branches unavailable</CardTitle>
      </CardHeader>
      <CardContent>
        <p role="alert" className="text-sm text-muted-foreground">
          COMS could not load your branch choices. Refresh this page to try
          again.
        </p>
      </CardContent>
    </Card>
  );
}

function asManagementProps(view: BranchProductsViewResult) {
  if (view.status === "ready")
    return {
      branchOptions: view.branchOptions,
      selectedBranch: view.selectedBranch,
      filters: view.filters,
      page: view.page,
      productOptions: view.productOptions,
      productOptionsUnavailable: view.productOptionsUnavailable,
      canCreate: view.canCreate,
      canUpdatePrice: view.canUpdatePrice,
      canUpdateAvailability: view.canUpdateAvailability,
    };
  if (view.status === "branch-unavailable")
    return {
      branchOptions: view.branchOptions,
      filters: view.filters,
      page: null,
      productOptions: [],
      productOptionsUnavailable: false,
      canCreate: false,
      canUpdatePrice: false,
      canUpdateAvailability: false,
      errorMessage: view.message,
    };
  if (view.status === "branch-products-error")
    return {
      branchOptions: view.branchOptions,
      selectedBranch: view.selectedBranch,
      filters: view.filters,
      page: null,
      productOptions: [],
      productOptionsUnavailable: false,
      canCreate: false,
      canUpdatePrice: false,
      canUpdateAvailability: false,
      errorMessage:
        "COMS could not load branch product offers. Refresh this page to try again.",
    };
  return null;
}

export default async function BranchProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;

  const view = await loadBranchProductsView(session.user, await searchParams);
  if (view.status === "forbidden") notFound();
  if (view.status === "session-expired") redirect("/");
  if (view.status === "redirect") redirect(view.href);

  return (
    <AppPageShell user={session.user} title="Branch Products">
      {view.status === "branch-options-error" ? (
        <BranchOptionsError />
      ) : (
        <BranchProductsManagement
          {...asManagementProps(view)!}
          createAction={createBranchProductAction}
          priceAction={updateBranchProductPriceAction}
          availabilityAction={updateBranchProductAvailabilityAction}
        />
      )}
    </AppPageShell>
  );
}
