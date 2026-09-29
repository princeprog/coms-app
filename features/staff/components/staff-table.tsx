import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffDirectoryRow } from "@/features/staff/components/staff-directory-row";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffPage,
} from "@/features/staff/types/staff.types";

export function StaffTable({
  staff,
  branchOptions,
  roles,
  rolesFailed,
  branchId,
  currentUserId,
  isSuperAdmin,
  permissions,
}: {
  staff: StaffPage;
  branchOptions: StaffBranchOption[];
  roles: Role[];
  rolesFailed: boolean;
  branchId?: string;
  currentUserId: string;
  isSuperAdmin: boolean;
  permissions: StaffManagementPermissions;
}) {
  return (
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Staff table"
      tabIndex={0}
    >
      <Table aria-label="Staff directory" className="min-w-[54rem]">
        <TableHeader>
          <TableRow>
            <TableHead>Staff member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch assignments</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.items.map((member) => (
            <StaffDirectoryRow
              key={member.id}
              staff={member}
              branchOptions={branchOptions}
              roles={roles}
              rolesFailed={rolesFailed}
              branchId={branchId}
              currentUserId={currentUserId}
              isSuperAdmin={isSuperAdmin}
              permissions={permissions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
