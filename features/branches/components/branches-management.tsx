"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { BranchCreateForm } from "./branch-create-form";
import { BranchTable } from "./branch-table";
import { BranchDirectoryControls } from "./branch-directory-controls";
import { BranchDirectoryPagination } from "./branch-directory-pagination";
import {
  branchDirectoryDefaults,
  branchDirectoryHref,
} from "../services/branch-directory-params";
import type {
  BranchAccess,
  BranchDirectoryFilters,
  BranchPage,
} from "../types/branch.types";

export function BranchesManagement({
  branches,
  branchAccess,
  canCreateBranch,
  filters = branchDirectoryDefaults,
}: {
  branches: BranchPage;
  branchAccess: BranchAccess;
  canCreateBranch: boolean;
  filters?: BranchDirectoryFilters;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const filtered = Boolean(
    filters.search || filters.status || filters.service_type,
  );
  function complete(message: string) {
    toast.success(message);
    router.refresh();
  }
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Toaster />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">Branches</h2>
            <span className="text-sm text-muted-foreground">
              {branches.total} {filtered ? "matching " : ""}
              {branches.total === 1 ? "branch" : "branches"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your locations and the services they offer.
          </p>
        </div>
        {canCreateBranch && (
          <Button
            type="button"
            className="h-11 sm:h-10"
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add branch
          </Button>
        )}
      </header>
      <BranchDirectoryControls filters={filters}>
        {branches.items.length ? (
          <BranchTable
            branches={branches}
            branchAccess={branchAccess}
            onComplete={complete}
          />
        ) : (
          <OperationalEmptyState
            title={
              filtered
                ? "No branches match your filters"
                : "No branches in this scope"
            }
            description={
              filtered
                ? "Try another branch name or clear the filters."
                : canCreateBranch
                  ? "Create a branch to add a new operating location."
                  : "Ask an administrator to assign a branch to your account."
            }
            actions={
              filtered ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href={branchDirectoryHref({
                        ...branchDirectoryDefaults,
                        sort: filters.sort,
                      })}
                    />
                  }
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
        <BranchDirectoryPagination
          branches={branches}
          href={(page) => branchDirectoryHref({ ...filters, page })}
        />
      </BranchDirectoryControls>
      <BranchCreateForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onComplete={(code) => {
          toast.success("Branch created.", { description: `Code: ${code}` });
          router.refresh();
        }}
      />
    </div>
  );
}
