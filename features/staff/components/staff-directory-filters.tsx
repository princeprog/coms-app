"use client";

import { useEffect } from "react";
import { Search, Store, Building2 } from "lucide-react";
import { StaffFilterChips } from "./staff-filter-chips";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { DirectorySelect } from "@/components/shared/directory-select";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createStaffPageHref,
  type StaffStatusFilter,
} from "../services/staff-page-params";
import type { StaffBranchOption } from "../types/staff.types";
import { staffStatusOptions } from "./staff-filter-options";

const ALL_BRANCHES = "__all_branches__";
export function StaffDirectoryFilters({
  branchOptions,
  selectedBranchId,
  search,
  status,
  page,
  isSuperAdmin,
  onPendingChange,
}: {
  branchOptions: StaffBranchOption[];
  selectedBranchId?: string;
  search: string;
  status: StaffStatusFilter;
  page: number;
  isSuperAdmin: boolean;
  onPendingChange: (pending: boolean) => void;
}) {
  const query = useDirectoryQuery(
    { page, search, status, branchId: selectedBranchId },
    (next) =>
      createStaffPageHref(next.page, next.branchId, next.search, next.status),
  );
  useEffect(
    () => onPendingChange(query.pending),
    [query.pending, onPendingChange],
  );
  const branches = branchOptions.map((branch) => ({
    value: branch.id,
    label: branch.name,
    icon: <Store className="text-blue-600! dark:text-blue-400!" />,
  }));
  if (
    selectedBranchId &&
    !branchOptions.some((branch) => branch.id === selectedBranchId)
  )
    branches.unshift({
      value: selectedBranchId,
      label: "Selected branch",
      icon: <Store className="text-blue-600! dark:text-blue-400!" />,
    });
  if (isSuperAdmin)
    branches.unshift({
      value: ALL_BRANCHES,
      label: "All branches",
      icon: <Building2 className="text-blue-600! dark:text-blue-400!" />,
    });
  const fixedBranch = !isSuperAdmin && branches.length === 1;
  return (
    <section aria-label="Staff filters" className="flex min-w-0 flex-col gap-3">
      <form
        action="/staff"
        aria-label="Search staff"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_16rem] xl:items-end [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:px-3"
        onSubmit={(event) => {
          event.preventDefault();
          query.flushSearch();
        }}
      >
        <Field className="min-w-0 sm:col-span-2 xl:col-span-1">
          <FieldLabel htmlFor="staff-search">Search staff</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon className="pl-3">
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="staff-search"
              name="search"
              type="search"
              maxLength={120}
              value={query.search}
              onChange={(event) => query.changeSearch(event.target.value)}
              placeholder="Search by name, email, or contact number…"
              className="h-full text-base md:text-sm"
            />
          </InputGroup>
        </Field>
        <DirectorySelect
          id="staff-status"
          label="Status"
          value={status}
          options={staffStatusOptions}
          alignItemWithTrigger={false}
          className="sm:w-full"
          onChange={(value) =>
            query.apply({ status: value as StaffStatusFilter })
          }
        />
        {fixedBranch ? (
          <Field className="min-w-0">
            <FieldLabel>Branch</FieldLabel>
            <p className="flex h-10 min-w-0 items-center gap-2 rounded-lg border bg-muted/30 px-3 text-sm">
              <Store
                aria-hidden="true"
                className="size-4 shrink-0 text-blue-600 dark:text-blue-400"
              />
              <span className="truncate">{branches[0].label}</span>
            </p>
          </Field>
        ) : (
          <DirectorySelect
            id="staff-branch-scope"
            label="Branch scope"
            value={selectedBranchId ?? ALL_BRANCHES}
            options={branches}
            alignItemWithTrigger={false}
            className="sm:w-full"
            onChange={(value) =>
              query.apply({
                branchId: value === ALL_BRANCHES ? undefined : value,
              })
            }
          />
        )}
      </form>
      <StaffFilterChips
        search={search}
        status={status}
        selectedBranchId={selectedBranchId}
        isSuperAdmin={isSuperAdmin}
        branchLabel={
          branches.find((branch) => branch.value === selectedBranchId)?.label
        }
        onApply={(change) => {
          if (change.search !== undefined) query.changeSearch(change.search);
          query.apply(change);
        }}
      />
      <span
        role="status"
        className={query.pending ? "text-xs text-muted-foreground" : "sr-only"}
      >
        {query.pending ? "Updating staff…" : "Search updates as you type."}
      </span>
    </section>
  );
}
