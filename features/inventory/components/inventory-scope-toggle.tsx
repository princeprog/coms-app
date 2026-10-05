"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function InventoryScopeToggle({
  scope,
  canViewCommissary,
  canViewBranch,
  hasBranches,
  onValueChange,
}: {
  scope: "COMMISSARY" | "BRANCH";
  canViewCommissary: boolean;
  canViewBranch: boolean;
  hasBranches: boolean;
  onValueChange: (scope: "COMMISSARY" | "BRANCH") => void;
}) {
  return (
    <Field className="min-w-0">
      <FieldLabel id="inventory-scope-label">Location</FieldLabel>
      <ToggleGroup
        aria-labelledby="inventory-scope-label"
        variant="outline"
        size="lg"
        spacing={0}
        value={[scope]}
        className="w-full sm:w-80"
        onValueChange={(values) => {
          const nextScope = values[0];
          if (nextScope === "COMMISSARY" && canViewCommissary)
            onValueChange(nextScope);
          if (nextScope === "BRANCH" && canViewBranch && hasBranches)
            onValueChange(nextScope);
        }}
      >
        <ToggleGroupItem
          value="COMMISSARY"
          disabled={!canViewCommissary}
          className="h-auto min-h-11 min-w-0 flex-1 whitespace-normal"
        >
          Commissary
        </ToggleGroupItem>
        <ToggleGroupItem
          value="BRANCH"
          disabled={!canViewBranch || !hasBranches}
          className="h-auto min-h-11 min-w-0 flex-1 whitespace-normal"
        >
          Branches
        </ToggleGroupItem>
      </ToggleGroup>
      {!canViewCommissary ? (
        <FieldDescription>
          You can view inventory at your assigned branches.
        </FieldDescription>
      ) : !canViewBranch ? (
        <FieldDescription>
          Branch inventory access is unavailable.
        </FieldDescription>
      ) : !hasBranches ? (
        <FieldDescription>No branches are available to view.</FieldDescription>
      ) : null}
    </Field>
  );
}
