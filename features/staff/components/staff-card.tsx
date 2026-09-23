import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StaffMember } from "@/features/staff/types/staff.types";

export type StaffBranchOption = { id: string; name: string };

export function StaffCard({
  staff,
  branchOptions,
}: {
  staff: StaffMember;
  branchOptions: StaffBranchOption[];
}) {
  const branchNames = new Map(
    branchOptions.map((branch) => [branch.id, branch.name]),
  );

  return (
    <Card aria-labelledby={`staff-${staff.id}`}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle id={`staff-${staff.id}`} className="text-base">
              {staff.full_name}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {staff.role_name}
            </p>
          </div>
          <Badge variant={staff.is_active ? "secondary" : "outline"}>
            {staff.is_active ? "Active account" : "Inactive account"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>{staff.email}</p>
        <p className="text-muted-foreground">{staff.contact_number}</p>
        <div>
          <span className="font-medium">Branch access: </span>
          {staff.branch_ids.length > 0
            ? staff.branch_ids
                .map((id) => branchNames.get(id) ?? `Branch ${id.slice(0, 8)}`)
                .join(", ")
            : "None assigned"}
        </div>
      </CardContent>
    </Card>
  );
}
