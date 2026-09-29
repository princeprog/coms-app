import { Badge } from "@/components/ui/badge";
import {
  OperationalEmptyState,
  OperationalPageIntro,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import { StaffCreateSection } from "@/features/staff/components/staff-create-section";
import { StaffDirectoryFilters } from "@/features/staff/components/staff-directory-filters";
import { StaffTable } from "@/features/staff/components/staff-table";
import {
  createStaffPageHref,
  type StaffStatusFilter,
} from "@/features/staff/services/staff-page-params";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffPage,
} from "@/features/staff/types/staff.types";

export function StaffDirectory({
  staff,
  branchOptions,
  selectedBranchId,
  search,
  status = "all",
  isSuperAdmin,
  canCreateStaff,
  canReadRoles,
  roleOptions,
  roleOptionsFailed,
  currentUserId = "",
  managementPermissions = {
    canUpdate: false,
    canAssignRole: false,
    canAssignBranches: false,
    canDeactivate: false,
    canReadRoles: false,
    canReadBranches: false,
  },
}: {
  staff: StaffPage;
  branchOptions: StaffBranchOption[];
  selectedBranchId?: string;
  search: string;
  status?: StaffStatusFilter;
  isSuperAdmin: boolean;
  canCreateStaff: boolean;
  canReadRoles: boolean;
  roleOptions: Role[];
  roleOptionsFailed: boolean;
  currentUserId?: string;
  managementPermissions?: StaffManagementPermissions;
}) {
  const pageCount = Math.max(1, Math.ceil(staff.total / staff.page_size));
  const rangeStart =
    staff.total === 0 ? 0 : (staff.page - 1) * staff.page_size + 1;
  const rangeEnd = Math.min(staff.page * staff.page_size, staff.total);

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6">
      <OperationalPageIntro description="Manage staff profiles, account roles, and branch access. Each change is saved separately." />

      <StaffDirectoryFilters
        key={`${selectedBranchId ?? "all"}:${search}:${status}`}
        branchOptions={branchOptions}
        selectedBranchId={selectedBranchId}
        search={search}
        status={status}
        isSuperAdmin={isSuperAdmin}
        toolbarActions={
          <>
            <Badge variant="outline">
              {staff.total}{" "}
              {staff.total === 1 ? "staff member" : "staff members"}
            </Badge>
            {canCreateStaff && (
              <StaffCreateSection
                roles={roleOptions}
                branches={branchOptions}
                initialBranchId={selectedBranchId}
                canReadRoles={canReadRoles}
                rolesFailed={roleOptionsFailed}
              />
            )}
          </>
        }
      />

      <section
        aria-labelledby="staff-directory-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="staff-directory-heading" className="text-xl font-semibold">
            Staff directory
          </h2>
          {staff.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {staff.total}
            </p>
          )}
        </div>

        {staff.items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <StaffTable
              staff={staff}
              branchOptions={branchOptions}
              roles={roleOptions}
              rolesFailed={roleOptionsFailed}
              branchId={selectedBranchId}
              currentUserId={currentUserId}
              isSuperAdmin={isSuperAdmin}
              permissions={managementPermissions}
            />
          </div>
        ) : (
          <OperationalEmptyState
            title={
              search
                ? "No staff match this search"
                : status === "active"
                  ? "No active staff found"
                  : status === "inactive"
                    ? "No inactive staff found"
                    : status === "unassigned"
                      ? "No unassigned staff found"
                      : "No staff in this branch yet"
            }
            description={
              selectedBranchId
                ? "Try another search, status, or branch. Staff appear only in branches you can access."
                : "Try another search or status filter."
            }
          />
        )}

        <div className="mx-auto w-full max-w-md">
          <OperationalPagination
            ariaLabel="Staff pages"
            page={staff.page}
            pageCount={pageCount}
            previousHref={
              staff.page > 1
                ? createStaffPageHref(
                    staff.page - 1,
                    selectedBranchId,
                    search,
                    status,
                  )
                : undefined
            }
            nextHref={
              staff.page < pageCount
                ? createStaffPageHref(
                    staff.page + 1,
                    selectedBranchId,
                    search,
                    status,
                  )
                : undefined
            }
            resultSummary={`Page ${staff.page} of ${pageCount}`}
          />
        </div>
      </section>
    </div>
  );
}
