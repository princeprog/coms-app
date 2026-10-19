"use client";

import { Store } from "lucide-react";
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
          className="w-full px-3 data-[size=default]:h-10"
        >
          <SelectValue placeholder="Select a branch">
            <BranchLabel label={label} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          side="bottom"
          alignItemWithTrigger={false}
          data-coms-ui="operational"
        >
          <SelectGroup>
            {branchOptions.map((branch) => (
              <SelectItem key={branch.id} value={`BRANCH:${branch.id}`}>
                <BranchLabel
                  label={
                    branch.status === "inactive"
                      ? `${branch.name} (inactive)`
                      : branch.name
                  }
                />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function BranchLabel({ label }: { label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Store
        aria-hidden="true"
        className="size-4 shrink-0 text-blue-600! dark:text-blue-400! [&_*]:text-inherit!"
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
