import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { createStaffPageHref } from "@/features/staff/services/staff-page-params";
import type { StaffBranchOption } from "@/features/staff/components/staff-card";

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
  const selectedBranchExists = branchOptions.some(
    (branch) => branch.id === selectedBranchId,
  );
  const clearSearchHref = createStaffPageHref(1, selectedBranchId, "");

  return (
    <section
      aria-label="Staff filters"
      className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2"
    >
      <form
        action="/staff"
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="staff-branch-scope" className="text-sm font-medium">
            Branch scope
          </label>
          <NativeSelect
            id="staff-branch-scope"
            name="branch_id"
            defaultValue={selectedBranchId ?? ""}
          >
            {isSuperAdmin && (
              <NativeSelectOption value="">All branches</NativeSelectOption>
            )}
            {selectedBranchId && !selectedBranchExists && (
              <NativeSelectOption value={selectedBranchId}>
                Selected branch {selectedBranchId.slice(0, 8)}
              </NativeSelectOption>
            )}
            {branchOptions.map((branch) => (
              <NativeSelectOption key={branch.id} value={branch.id}>
                {branch.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {search && <input type="hidden" name="search" value={search} />}
        </div>
        <Button type="submit" variant="outline">
          Apply branch
        </Button>
      </form>

      <form
        action="/staff"
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="staff-search" className="text-sm font-medium">
            Search staff
          </label>
          <Input
            id="staff-search"
            type="search"
            name="search"
            defaultValue={search}
            maxLength={120}
            placeholder="Name, email, or contact number"
          />
          {selectedBranchId && (
            <input type="hidden" name="branch_id" value={selectedBranchId} />
          )}
        </div>
        <Button type="submit">Search</Button>
      </form>
      {search && (
        <Link
          href={clearSearchHref}
          className={buttonVariants({ variant: "outline" })}
        >
          Clear search
        </Link>
      )}
    </section>
  );
}
