import type { StaffBranchOption } from "@/features/staff/components/staff-card";

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
    <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">Branch assignments</legend>
      {branches.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <label
              key={branch.id}
              className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm focus-within:ring-2 focus-within:ring-ring"
            >
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={selectedBranchIds.includes(branch.id)}
                onChange={(event) =>
                  toggleBranch(branch.id, event.currentTarget.checked)
                }
              />
              {branch.name}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No active branch options are available.
        </p>
      )}
    </fieldset>
  );
}
