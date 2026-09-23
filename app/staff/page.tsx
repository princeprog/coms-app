import { notFound, redirect } from "next/navigation";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import type { Role } from "@/features/roles/types/role.types";
import { StaffDirectory } from "@/features/staff/components/staff-directory";
import {
  getStaffBranchOptions,
  getStaffPageData,
  getStaffRoleOptions,
} from "@/features/staff/services/staff-queries";
import {
  createStaffPageHref,
  parseStaffPageFilters,
  resolveStaffBranchSelection,
} from "@/features/staff/services/staff-page-params";
import type { StaffPage } from "@/features/staff/types/staff.types";
import { ApiRequestError } from "@/services/api-services";

function isProtectedSuperAdmin(user: {
  role?: { isActive: boolean; isSystem: boolean; code: string } | null;
}) {
  return Boolean(
    user.role?.isActive &&
    user.role.isSystem &&
    user.role.code === "SUPER_ADMIN",
  );
}

function BranchAccessRequired() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch access required</CardTitle>
      </CardHeader>
      <CardContent>
        <p role="status" className="text-sm text-muted-foreground">
          Ask an administrator to assign your account to an active branch before
          viewing staff.
        </p>
      </CardContent>
    </Card>
  );
}

function StaffLoadError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unable to load staff</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-muted-foreground">
          COMS could not load the staff directory. Try again in a moment.
        </p>
        <form>
          <Button type="submit" variant="outline">
            Try again
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable") {
    return <AuthServiceError context="dashboard" />;
  }
  if (!hasPermission(session.user, "staff.read")) notFound();

  const filters = parseStaffPageFilters(await searchParams);
  const isSuperAdmin = isProtectedSuperAdmin(session.user);
  const selection = resolveStaffBranchSelection({
    isSuperAdmin,
    assignedBranchIds: session.user.branch_ids ?? [],
    requestedBranchId: filters.requestedBranchId,
  });
  if (selection.status === "out-of-scope") notFound();

  return (
    <AppPageShell user={session.user} title="Staff">
      {selection.status === "no-branch" ? (
        <BranchAccessRequired />
      ) : (
        <StaffDirectoryPageContent
          page={filters.page}
          search={filters.search}
          selectedBranchId={selection.branchId}
          isSuperAdmin={isSuperAdmin}
          assignedBranchIds={session.user.branch_ids ?? []}
          canReadBranches={hasPermission(session.user, "branches.read")}
          canCreateStaff={hasPermission(session.user, "staff.create")}
          canReadRoles={hasPermission(session.user, "roles.read")}
        />
      )}
    </AppPageShell>
  );
}

async function StaffDirectoryPageContent({
  page,
  search,
  selectedBranchId,
  isSuperAdmin,
  assignedBranchIds,
  canReadBranches,
  canCreateStaff,
  canReadRoles,
}: {
  page: number;
  search: string;
  selectedBranchId?: string;
  isSuperAdmin: boolean;
  assignedBranchIds: string[];
  canReadBranches: boolean;
  canCreateStaff: boolean;
  canReadRoles: boolean;
}) {
  const branchIdSet = new Set(assignedBranchIds);
  let branchOptions = isSuperAdmin
    ? []
    : assignedBranchIds.map((id) => ({
        id,
        name: `Branch ${id.slice(0, 8)}`,
      }));

  if (canReadBranches) {
    try {
      const options = await getStaffBranchOptions();
      branchOptions = isSuperAdmin
        ? options
        : options.filter((branch) => branchIdSet.has(branch.id));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        redirect("/");
      }
    }
  }

  let staff: StaffPage;
  try {
    staff = await getStaffPageData({
      page,
      pageSize: 25,
      search,
      branchId: selectedBranchId,
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && error.status === 403) notFound();
    return <StaffLoadError />;
  }

  const lastPage = Math.max(1, Math.ceil(staff.total / staff.page_size));
  if (staff.page > lastPage) {
    redirect(createStaffPageHref(lastPage, selectedBranchId, search));
  }

  let roleOptions: Role[] = [];
  let roleOptionsFailed = false;
  if (canCreateStaff && canReadRoles) {
    try {
      roleOptions = await getStaffRoleOptions();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401)
        redirect("/");
      roleOptionsFailed = true;
    }
  }

  return (
    <StaffDirectory
      staff={staff}
      branchOptions={branchOptions}
      selectedBranchId={selectedBranchId}
      search={search}
      isSuperAdmin={isSuperAdmin}
      canCreateStaff={canCreateStaff}
      canReadRoles={canReadRoles}
      roleOptions={roleOptions}
      roleOptionsFailed={roleOptionsFailed}
    />
  );
}
