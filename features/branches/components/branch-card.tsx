"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deactivateBranchAction } from "@/features/branches/services/branch-actions";
import type {
  Branch,
  BranchMutationResult,
} from "@/features/branches/types/branch.types";
import { BranchEditorForm } from "@/features/branches/components/branch-editor-form";

export function BranchCard({
  branch,
  canUpdate,
  canDeactivate,
  onComplete,
}: {
  branch: Branch;
  canUpdate: boolean;
  canDeactivate: boolean;
  onComplete: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function deactivate() {
    setError("");
    setPending(true);
    let result: BranchMutationResult;
    try {
      result = await deactivateBranchAction(branch.id);
    } catch {
      setPending(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    setStatus("Branch deactivated.");
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{branch.branch_name}</CardTitle>
          <Badge variant="outline">{branch.code}</Badge>
          <Badge
            variant={branch.status === "active" ? "outline" : "destructive"}
          >
            {branch.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd>{branch.address || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date opened</dt>
            <dd>{branch.date_opened?.slice(0, 10) || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dine-in</dt>
            <dd>{branch.has_dine_in ? "Available" : "Not available"}</dd>
          </div>
        </dl>
        {canUpdate && branch.status === "active" && (
          <BranchEditorForm branch={branch} onComplete={onComplete} />
        )}
        {canDeactivate && branch.status === "active" && (
          <div className="flex flex-col items-start gap-2 border-t pt-4">
            <AlertDialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) setError("");
              }}
            >
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="destructive">
                    Deactivate branch
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Deactivate {branch.branch_name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The branch will no longer be available for new operations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => void deactivate()}
                  >
                    {pending ? "Deactivating…" : "Confirm deactivation"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {status && (
              <p role="status" className="text-sm text-muted-foreground">
                {status}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
