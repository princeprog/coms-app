"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MAX_STAFF_BRANCH_ASSIGNMENTS } from "@/features/staff/constants";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

export function StaffCreateBranchPicker({
  branches,
  selectedBranchIds,
  pending,
  onChange,
  onLimitReached,
}: {
  branches: StaffBranchOption[];
  selectedBranchIds: string[];
  pending: boolean;
  onChange: (branchIds: string[]) => void;
  onLimitReached: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedCount = selectedBranchIds.length;
  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchIds[0],
  );
  const filteredBranches = branches.filter((branch) =>
    branch.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const summary =
    selectedCount === 0
      ? "Select branches"
      : selectedCount === 1
        ? (selectedBranch?.name ?? "1 branch selected")
        : `${selectedCount} branches selected`;

  function toggleBranch(branchId: string, checked: boolean) {
    if (checked) {
      if (selectedBranchIds.includes(branchId)) return;
      if (selectedCount >= MAX_STAFF_BRANCH_ASSIGNMENTS) {
        onLimitReached();
        return;
      }
      onChange([...selectedBranchIds, branchId]);
      return;
    }
    onChange(selectedBranchIds.filter((id) => id !== branchId));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id="staff-create-branches"
            type="button"
            variant="outline"
            className="h-9 w-full min-w-0 justify-between px-3 text-left font-normal hover:bg-background aria-expanded:bg-background"
            disabled={pending || branches.length === 0}
            aria-label="Branches"
          />
        }
      >
        <span className="min-w-0 truncate">{summary}</span>
        <ChevronDown className="text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        data-coms-ui="operational"
        align="start"
        className="w-[min(24rem,calc(100vw-2rem))] gap-0 p-0 sm:w-(--anchor-width)"
      >
        <PopoverHeader className="gap-0 px-4 pt-4 pb-3">
          <PopoverTitle>Assign branches</PopoverTitle>
          <PopoverDescription>
            {selectedCount} selected · Up to {MAX_STAFF_BRANCH_ASSIGNMENTS}{" "}
            active branches
          </PopoverDescription>
        </PopoverHeader>
        <div className="px-3 pb-3">
          <InputGroup>
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search branches"
              placeholder="Search branches"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
        </div>
        <div
          className="max-h-56 overflow-y-auto border-y p-1"
          role="group"
          aria-label="Available branches"
        >
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => {
              const checked = selectedBranchIds.includes(branch.id);
              return (
                <label
                  key={branch.id}
                  className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    aria-labelledby={`staff-create-branch-${branch.id}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleBranch(branch.id, value === true)
                    }
                  />
                  <span
                    id={`staff-create-branch-${branch.id}`}
                    className="min-w-0 flex-1 break-words"
                  >
                    {branch.name}
                  </span>
                </label>
              );
            })
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No branches match your search.
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => onChange([])}
          >
            Clear selection
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
