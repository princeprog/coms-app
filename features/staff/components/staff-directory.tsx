"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { StaffPagination } from "./staff-pagination";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { StaffCreateSection } from "@/features/staff/components/staff-create-section";
import { StaffDirectoryFilters } from "@/features/staff/components/staff-directory-filters";
import { StaffTable } from "@/features/staff/components/staff-table";
import { type StaffStatusFilter } from "@/features/staff/services/staff-page-params";
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
  const [pending, setPending] = useState(false);

  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Staff</h2>
        {canCreateStaff && (
          <StaffCreateSection
            roles={roleOptions}
            branches={branchOptions}
            initialBranchId={selectedBranchId}
            canReadRoles={canReadRoles}
            rolesFailed={roleOptionsFailed}
          />
        )}
      </header>
      <StaffDirectoryFilters
        branchOptions={branchOptions}
        selectedBranchId={selectedBranchId}
        search={search}
        status={status}
        page={staff.page}
        isSuperAdmin={isSuperAdmin}
        onPendingChange={setPending}
      />
      <Card
        aria-label="Staff directory"
        aria-busy={pending}
        className="min-w-0 gap-0 overflow-hidden py-0"
      >
        <CardContent className={pending ? "p-0 opacity-60" : "p-0"}>
          {staff.items.length > 0 ? (
            <div className="min-w-0">
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
            <div className="px-5 py-10">
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
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t px-4 py-3 sm:px-5">
          <StaffPagination
            staff={staff}
            branchId={selectedBranchId}
            search={search}
            status={status}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
