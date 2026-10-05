"use client";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Branch } from "@/features/branches/types/branch.types";
export function DispatchBranchField({
  branches,
  branchId,
  disabled,
  onChange,
}: {
  branches: Branch[];
  branchId: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="dispatch-branch">Branch</FieldLabel>
      <Select
        value={branchId}
        disabled={disabled}
        onValueChange={(value) => onChange(value ?? "")}
      >
        <SelectTrigger id="dispatch-branch" className="w-full">
          <SelectValue>
            {(value: unknown) =>
              branches.find((branch) => branch.id === value)?.branch_name ??
              "Select a branch"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          side="bottom"
          alignItemWithTrigger={false}
          collisionAvoidance={{
            side: "none",
            align: "shift",
            fallbackAxisSide: "none",
          }}
          className="max-h-56"
          data-coms-ui="operational"
        >
          <SelectGroup>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.branch_name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>
        Dispatches can only be sent to active branches available to your
        account.
      </FieldDescription>
    </Field>
  );
}
