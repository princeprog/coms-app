import type { StaffBranchOption } from "@/features/staff/types/staff.types";
import { MAX_STAFF_BRANCH_ASSIGNMENTS } from "@/features/staff/constants";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

export function StaffBranchAssignments({
  branches,
  disabled = false,
  selectedBranchIds,
  onChange,
  onLimitReached,
}: {
  branches: StaffBranchOption[];
  disabled?: boolean;
  selectedBranchIds: string[];
  onChange: (branchIds: string[]) => void;
  onLimitReached: () => void;
}) {
  function toggleBranch(branchId: string, checked: boolean) {
    if (checked) {
      if (selectedBranchIds.includes(branchId)) return;
      if (selectedBranchIds.length >= MAX_STAFF_BRANCH_ASSIGNMENTS) {
        onLimitReached();
        return;
      }
      onChange([...selectedBranchIds, branchId]);
      return;
    }
    onChange(selectedBranchIds.filter((id) => id !== branchId));
  }

  return (
    <FieldSet className="min-w-0 gap-3">
      <FieldLegend variant="label">Branch assignments</FieldLegend>
      {branches.length > 0 ? (
        <div className="grid max-h-72 gap-2 overflow-y-auto p-1 sm:grid-cols-2">
          {branches.map((branch) => (
            <Field
              key={branch.id}
              orientation="horizontal"
              className="min-h-12 items-center gap-3 rounded-lg border px-3 py-2 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5"
            >
              <Checkbox
                disabled={disabled}
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
