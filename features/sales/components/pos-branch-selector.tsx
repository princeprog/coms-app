"use client";

import { useState } from "react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salesRoute } from "@/features/sales/constants";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";

export function PosBranchSelector({
  branches,
  selectedBranchId,
}: {
  branches: BranchProductBranchOption[];
  selectedBranchId: string;
}) {
  const [branchChoice, setBranchChoice] = useState(selectedBranchId);

  return (
    <Form
      action={salesRoute}
      aria-label="Choose sales branch"
      className="rounded-lg border bg-card p-4"
    >
      <FieldGroup className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end">
        <Field className="min-w-0">
          <FieldLabel htmlFor="pos-branch">Branch</FieldLabel>
          <Select
            value={branchChoice}
            onValueChange={(value) =>
              setBranchChoice(value ?? selectedBranchId)
            }
          >
            <SelectTrigger id="pos-branch" className="w-full">
              <SelectValue>
                {(value: unknown) => {
                  const branch = branches.find((item) => item.id === value);
                  if (!branch) return "Choose a branch";
                  return `${branch.name}${branch.status === "inactive" ? " (inactive)" : ""}`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.status === "inactive" ? " (inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="branch_id" value={branchChoice} />
        </Field>
        <Button type="submit" variant="outline" className="w-fit">
          Open branch
        </Button>
      </FieldGroup>
    </Form>
  );
}
