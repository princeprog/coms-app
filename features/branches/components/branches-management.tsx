"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BranchCard } from "@/features/branches/components/branch-card";
import { BranchCreateForm } from "@/features/branches/components/branch-create-form";
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
  const pageCount = Math.max(1, Math.ceil(branches.total / branches.page_size));
  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-wrap items-center justify-between gap-4"
        aria-label="Branch summary"
      >
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage branch details and access. Updates are limited to branches
          assigned to your account.
        </p>
        <Badge variant="outline">
          {branches.total} {branches.total === 1 ? "branch" : "branches"}
        </Badge>
      </section>

      {canCreateBranch && <BranchCreateForm onComplete={refresh} />}

      <section
        aria-labelledby="branch-directory-heading"
        className="flex flex-col gap-4"
      >
        <div>
          <h2 id="branch-directory-heading" className="text-lg font-semibold">
            Branch directory
          </h2>
          <p className="text-sm text-muted-foreground">
            Page {branches.page} of {pageCount}
          </p>
        </div>
        {branches.items.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {branches.items.map((branch) => {
              const access = branchAccess[branch.id] ?? {
                canUpdate: false,
                canDeactivate: false,
              };
              return (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  canUpdate={access.canUpdate}
                  canDeactivate={access.canDeactivate}
                  onComplete={refresh}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="font-medium">
                No branches are available in this scope.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask an administrator to assign a branch or create the first
                location.
              </p>
            </CardContent>
          </Card>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Branch pages"
            className="flex items-center justify-between"
          >
            {branches.page > 1 ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/branches?page=${branches.page - 1}`}
              >
                Previous page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Previous page
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {branches.page} of {pageCount}
            </span>
            {branches.page < pageCount ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={`/branches?page=${branches.page + 1}`}
              >
                Next page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Next page
              </Button>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
