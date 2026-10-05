"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryBranchOption } from "@/features/inventory/types/inventory.types";

export function InventoryBranchSelect({
  value,
  label,
  branchOptions,
  onValueChange,
}: {
  value: string;
  label: string;
  branchOptions: InventoryBranchOption[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor="inventory-branch">Branch</FieldLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onValueChange(nextValue);
        }}
      >
        <SelectTrigger
          id="inventory-branch"
          aria-label="Branch"
          className="w-full"
        >
          <SelectValue placeholder="Select a branch">{label}</SelectValue>
        </SelectTrigger>
        <SelectContent
          side="bottom"
          alignItemWithTrigger={false}
          data-coms-ui="operational"
        >
          <SelectGroup>
            {branchOptions.map((branch) => (
              <SelectItem key={branch.id} value={`BRANCH:${branch.id}`}>
                {branch.status === "inactive"
                  ? `${branch.name} (inactive)`
                  : branch.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
