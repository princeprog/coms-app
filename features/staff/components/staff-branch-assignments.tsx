import type { StaffBranchOption } from "@/features/staff/types/staff.types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const MAX_BRANCH_ASSIGNMENTS = 100;

export function StaffBranchAssignments({
  branches,
  selectedBranchIds,
  onChange,
  onLimitReached,
}: {
  branches: StaffBranchOption[];
  selectedBranchIds: string[];
  onChange: (branchIds: string[]) => void;
  onLimitReached: () => void;
}) {
  function toggleBranch(branchId: string, checked: boolean) {
    if (checked) {
      if (selectedBranchIds.includes(branchId)) return;
      if (selectedBranchIds.length >= MAX_BRANCH_ASSIGNMENTS) {
        onLimitReached();
        return;
      }
      onChange([...selectedBranchIds, branchId]);
      return;
    }
    onChange(selectedBranchIds.filter((id) => id !== branchId));
  }

  return (
    <FieldSet className="gap-3 rounded-lg border p-4">
      <FieldLegend variant="label">Branch assignments</FieldLegend>
      {branches.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Field
              key={branch.id}
              orientation="horizontal"
              className="min-h-10 items-center gap-3 rounded-md px-2"
            >
              <Checkbox
                id={`staff-branch-${branch.id}`}
                checked={selectedBranchIds.includes(branch.id)}
                onCheckedChange={(checked) =>
                  toggleBranch(branch.id, checked === true)
                }
              />
              <FieldLabel htmlFor={`staff-branch-${branch.id}`}>
                {branch.name}
              </FieldLabel>
            </Field>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No active branch options are available.
        </p>
      )}
    </FieldSet>
  );
}
