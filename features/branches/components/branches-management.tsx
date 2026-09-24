"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OperationalEmptyState,
  OperationalPageIntro,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import { BranchCreateForm } from "@/features/branches/components/branch-create-form";
import { BranchTable } from "@/features/branches/components/branch-table";
import type { BranchPage } from "@/features/branches/types/branch.types";

type BranchAccess = Record<
  string,
  { canUpdate: boolean; canDeactivate: boolean }
>;

export function BranchesManagement({
  branches,
  branchAccess,
  canCreateBranch,
}: {
  branches: BranchPage;
  branchAccess: BranchAccess;
  canCreateBranch: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState("");
  const pageCount = Math.max(1, Math.ceil(branches.total / branches.page_size));

  function complete(message: string) {
    setStatus(message);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <OperationalPageIntro
        description="Manage branch details and operating availability. Changes are limited to branches assigned to your account."
        count={
          <Badge variant="outline">
            {branches.total} {branches.total === 1 ? "branch" : "branches"}
          </Badge>
        }
        actions={
          canCreateBranch ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Add branch
            </Button>
          ) : undefined
        }
      />

      <section
        aria-labelledby="branch-directory-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="branch-directory-heading" className="text-lg font-semibold">
            Branch directory
          </h2>
          {branches.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {branches.items.length} of {branches.total} · Page{" "}
              {branches.page} of {pageCount}
            </p>
          )}
        </div>

        {branches.items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <BranchTable
              branches={branches}
              branchAccess={branchAccess}
              onComplete={complete}
            />
          </div>
        ) : (
          <OperationalEmptyState
            title="No branches in this scope"
            description={
              canCreateBranch
                ? "Create a branch to add a new operating location."
                : "Ask an administrator to assign a branch to your account."
            }
          />
        )}

        <OperationalPagination
          ariaLabel="Branch pages"
          page={branches.page}
          pageCount={pageCount}
          previousHref={
            branches.page > 1
              ? `/branches?page=${branches.page - 1}`
              : undefined
          }
          nextHref={
            branches.page < pageCount
              ? `/branches?page=${branches.page + 1}`
              : undefined
          }
          resultSummary={`Page ${branches.page} of ${pageCount}`}
        />
      </section>

      <BranchCreateForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onComplete={() => complete("Branch created.")}
      />
      {status && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status}
        </p>
      )}
    </div>
  );
}
