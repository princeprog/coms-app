import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { BranchesManagement } from "@/features/branches/components/branches-management";
import { getBranchPageData } from "@/features/branches/services/branch-queries";
import type { BranchPage } from "@/features/branches/types/branch.types";
import { ApiRequestError } from "@/services/api-services";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import {
  readBranchDirectoryFilters,
  branchDirectoryHref,
} from "@/features/branches/services/branch-directory-params";

export default async function BranchesPage({
  searchParams,
}: PageProps<"/branches">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!hasPermission(session.user, "branches.read")) notFound();

  const params = await searchParams;
  const filters = readBranchDirectoryFilters(params);

  let branches: BranchPage | null = null;
  try {
    branches = await getBranchPageData(filters.page, filters.search, filters);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
  }

  if (!branches) {
    return (
      <AppPageShell user={session.user}>
        <OperationalLoadError
          title="Branches"
          description="COMS could not load the branch list. Try again in a moment."
        />
      </AppPageShell>
    );
  }

  const lastPage = Math.max(1, Math.ceil(branches.total / branches.page_size));
  if (branches.page > lastPage)
    redirect(branchDirectoryHref({ ...filters, page: lastPage }));

  const branchAccess = Object.fromEntries(
    branches.items.map((branch) => [
      branch.id,
      {
        canManageDevices:
          hasPermission(session.user, "pos_offline.devices_manage") &&
          hasBranchScope(session.user, branch.id),
        canReviewOffline:
          hasPermission(session.user, "pos_offline.review") &&
          hasBranchScope(session.user, branch.id),
        canUpdate:
          hasPermission(session.user, "branches.update") &&
          hasBranchScope(session.user, branch.id),
        canDeactivate:
          hasPermission(session.user, "branches.deactivate") &&
          hasBranchScope(session.user, branch.id),
      },
    ]),
  );
  return (
    <AppPageShell user={session.user}>
      <BranchesManagement
        branches={branches}
        branchAccess={branchAccess}
        canCreateBranch={hasPermission(session.user, "branches.create")}
        filters={filters}
      />
    </AppPageShell>
  );
}
