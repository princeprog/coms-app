"use client";

import { useState, type ReactNode } from "react";
import Form from "next/form";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createStaffPageHref,
  type StaffStatusFilter,
} from "@/features/staff/services/staff-page-params";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

const ALL_BRANCHES = "__all_branches__";
const statusOptions: { value: StaffStatusFilter; label: string }[] = [
  { value: "all", label: "All staff" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "unassigned", label: "Unassigned" },
];

export function StaffDirectoryFilters({
  branchOptions,
  selectedBranchId,
  search,
  status,
  isSuperAdmin,
  toolbarActions,
}: {
  branchOptions: StaffBranchOption[];
  selectedBranchId?: string;
  search: string;
  status: StaffStatusFilter;
  isSuperAdmin: boolean;
  toolbarActions?: ReactNode;
}) {
  const [branchChoice, setBranchChoice] = useState(
    selectedBranchId ?? ALL_BRANCHES,
  );
  const selectedBranchExists = branchOptions.some(
    (branch) => branch.id === selectedBranchId,
  );
  const branchChoiceId =
    branchChoice === ALL_BRANCHES ? undefined : branchChoice;
  const unavailableBranchName = selectedBranchId
    ? `Selected branch ${selectedBranchId.slice(0, 8)}`
    : "Select a branch";

  return (
    <section aria-label="Staff filters" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Form
          action="/staff"
          aria-label="Search staff"
          className="min-w-0 flex-1"
        >
          <InputGroup>
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="staff-search"
              aria-label="Search staff"
              type="search"
              name="search"
              defaultValue={search}
              maxLength={120}
              placeholder="Search staff by name, email, or contact number"
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <Link
                  href={createStaffPageHref(1, selectedBranchId, "", status)}
                  aria-label="Clear search"
                  className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X aria-hidden="true" className="size-4" />
                </Link>
              </InputGroupAddon>
            )}
          </InputGroup>
          {selectedBranchId && (
            <input type="hidden" name="branch_id" value={selectedBranchId} />
          )}
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <button type="submit" className="sr-only">
            Search staff
          </button>
        </Form>
        {toolbarActions && (
          <div className="flex max-w-full flex-wrap items-center gap-3">
            {toolbarActions}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Staff status" className="max-w-full overflow-x-auto">
          <ButtonGroup className="min-w-max">
            {statusOptions.map(({ value, label }) => (
              <Link
                key={value}
                data-slot="button"
                href={createStaffPageHref(1, selectedBranchId, search, value)}
                aria-current={status === value ? "page" : undefined}
                className={buttonVariants({
                  variant: status === value ? "default" : "outline",
                })}
              >
                {label}
              </Link>
            ))}
          </ButtonGroup>
        </nav>

        <Form
          action="/staff"
          aria-label="Filter staff by branch"
          className="flex w-full min-w-0 flex-wrap items-center gap-3 sm:w-auto"
        >
          <FieldLabel htmlFor="staff-branch-scope" className="sr-only">
            Branch scope
          </FieldLabel>
          <Select
            value={branchChoice}
            onValueChange={(value) => setBranchChoice(value ?? ALL_BRANCHES)}
          >
            <SelectTrigger
              id="staff-branch-scope"
              className="w-full min-w-0 sm:w-auto sm:min-w-44 sm:max-w-64"
            >
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
          {branchChoiceId && (
            <input type="hidden" name="branch_id" value={branchChoiceId} />
          )}
          {search && <input type="hidden" name="search" value={search} />}
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <Button type="submit" variant="outline">
            <ListFilter aria-hidden="true" />
            Filter
          </Button>
        </Form>
      </div>
    </section>
  );
}
