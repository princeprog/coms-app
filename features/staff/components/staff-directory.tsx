import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StaffCreateSection } from "@/features/staff/components/staff-create-section";
import { StaffDirectoryFilters } from "@/features/staff/components/staff-directory-filters";
import { StaffCard } from "@/features/staff/components/staff-card";
import { createStaffPageHref } from "@/features/staff/services/staff-page-params";
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
  isSuperAdmin: boolean;
  canCreateStaff: boolean;
  canReadRoles: boolean;
  roleOptions: Role[];
  roleOptionsFailed: boolean;
  currentUserId?: string;
  managementPermissions?: StaffManagementPermissions;
}) {
  const pageCount = Math.max(1, Math.ceil(staff.total / staff.page_size));

  return (
    <div className="flex flex-col gap-6">
      {canCreateStaff && (
        <StaffCreateSection
          roles={roleOptions}
          branches={branchOptions}
          initialBranchId={selectedBranchId}
          canReadRoles={canReadRoles}
          rolesFailed={roleOptionsFailed}
        />
      )}
      <StaffDirectoryFilters
        branchOptions={branchOptions}
        selectedBranchId={selectedBranchId}
        search={search}
        isSuperAdmin={isSuperAdmin}
      />

      <section
        aria-labelledby="staff-directory-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="staff-directory-heading" className="text-lg font-semibold">
              Staff directory
            </h2>
            <p className="text-sm text-muted-foreground">
              Page {staff.page} of {pageCount}
            </p>
          </div>
          <Badge variant="outline">
            {staff.total} {staff.total === 1 ? "staff member" : "staff members"}
          </Badge>
        </div>

        {staff.items.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {staff.items.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                branchOptions={branchOptions}
                roles={roleOptions}
                rolesFailed={roleOptionsFailed}
                branchId={selectedBranchId}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                permissions={managementPermissions}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="font-medium">
                {search
                  ? "No staff match this search."
                  : "No staff in this branch yet."}
              </p>
              <p className="text-sm text-muted-foreground">
                Staff are shown only when assigned to the selected branch.
              </p>
            </CardContent>
          </Card>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Staff pages"
            className="flex items-center justify-between gap-4"
          >
            {staff.page > 1 ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={createStaffPageHref(
                  staff.page - 1,
                  selectedBranchId,
                  search,
                )}
              >
                Previous page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Previous page
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {staff.page} of {pageCount}
            </span>
            {staff.page < pageCount ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={createStaffPageHref(
                  staff.page + 1,
                  selectedBranchId,
                  search,
                )}
              >
                Next page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Next page
              </Button>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
