"use client";

import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffPageHref } from "@/features/staff/services/staff-page-params";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

const ALL_BRANCHES = "__all_branches__";

export function StaffDirectoryFilters({
  branchOptions,
  selectedBranchId,
  search,
  isSuperAdmin,
}: {
  branchOptions: StaffBranchOption[];
  selectedBranchId?: string;
  search: string;
  isSuperAdmin: boolean;
}) {
  const [branchChoice, setBranchChoice] = useState(
    selectedBranchId ?? ALL_BRANCHES,
  );
  const selectedBranchExists = branchOptions.some(
    (branch) => branch.id === selectedBranchId,
  );
  const clearSearchHref = createStaffPageHref(1, selectedBranchId, "");
  const branchChoiceId =
    branchChoice === ALL_BRANCHES ? undefined : branchChoice;
  const unavailableBranchName = selectedBranchId
    ? `Selected branch ${selectedBranchId.slice(0, 8)}`
    : "Select a branch";

  return (
    <section
      aria-label="Staff filters"
      className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2"
    >
      <Form
        action="/staff"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        aria-label="Filter staff by branch"
      >
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="staff-branch-scope">Branch scope</FieldLabel>
          <Select
            value={branchChoice}
            onValueChange={(value) => setBranchChoice(value ?? ALL_BRANCHES)}
          >
            <SelectTrigger id="staff-branch-scope" className="w-full">
              <SelectValue>
                {(value: unknown) => {
                  if (value === ALL_BRANCHES) return "All branches";
                  return (
                    branchOptions.find((branch) => branch.id === value)?.name ??
                    (value === selectedBranchId && !selectedBranchExists
                      ? unavailableBranchName
                      : "Select a branch")
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent data-coms-ui="operational">
              {isSuperAdmin && (
                <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              )}
              {selectedBranchId && !selectedBranchExists && (
                <SelectItem value={selectedBranchId}>
                  Selected branch {selectedBranchId.slice(0, 8)}
                </SelectItem>
              )}
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {branchChoiceId && (
          <input type="hidden" name="branch_id" value={branchChoiceId} />
        )}
        {search && <input type="hidden" name="search" value={search} />}
        <Button type="submit" variant="outline">
          Apply branch
        </Button>
      </Form>

      <Form
        action="/staff"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        aria-label="Search staff"
      >
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="staff-search">Search staff</FieldLabel>
          <Input
            id="staff-search"
            type="search"
            name="search"
            defaultValue={search}
            maxLength={120}
            placeholder="Name, email, or contact number"
          />
        </Field>
        {selectedBranchId && (
          <input type="hidden" name="branch_id" value={selectedBranchId} />
        )}
        <Button type="submit">Search</Button>
        {search && (
          <Link
            href={clearSearchHref}
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear search
          </Link>
        )}
      </Form>
    </section>
  );
}
