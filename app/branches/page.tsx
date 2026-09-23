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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number(rawPage);
  const page =
    Number.isInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= 1_000_000
      ? requestedPage
      : 1;

  let branches: BranchPage | null = null;
  try {
    branches = await getBranchPageData(page);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
  }

  if (!branches) {
    return (
      <AppPageShell user={session.user} title="Branches">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load branches</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="alert" className="text-sm text-muted-foreground">
              COMS could not load branches. Try refreshing this page in a
              moment.
            </p>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  const branchAccess = Object.fromEntries(
    branches.items.map((branch) => [
      branch.id,
      {
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
    <AppPageShell user={session.user} title="Branches">
      <BranchesManagement
        branches={branches}
        branchAccess={branchAccess}
        canCreateBranch={hasPermission(session.user, "branches.create")}
      />
    </AppPageShell>
  );
}
