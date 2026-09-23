import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffCreateForm } from "@/features/staff/components/staff-create-form";
import type { Role } from "@/features/roles/types/role.types";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

export function StaffCreateSection({
  roles,
  branches,
  initialBranchId,
  canReadRoles,
  rolesFailed,
}: {
  roles: Role[];
  branches: StaffBranchOption[];
  initialBranchId?: string;
  canReadRoles: boolean;
  rolesFailed: boolean;
}) {
  if (roles.length > 0) {
    return (
      <StaffCreateForm
        roles={roles}
        branches={branches}
        initialBranchId={initialBranchId}
      />
    );
  }

  const message = !canReadRoles
    ? "Your role needs roles.read access to select an account role."
    : rolesFailed
      ? "COMS could not load account roles. Try refreshing this page."
      : "Activate an assignable role before creating staff accounts.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff creation is unavailable</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          role={rolesFailed ? "alert" : "status"}
          className="text-sm text-muted-foreground"
        >
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
