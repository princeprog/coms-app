"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { BranchEditorForm } from "@/features/branches/components/branch-editor-form";
import { deactivateBranchAction } from "@/features/branches/services/branch-actions";
import type {
  Branch,
  BranchMutationResult,
} from "@/features/branches/types/branch.types";

export function BranchRow({
  branch,
  canUpdate,
  canDeactivate,
  onComplete,
}: {
  branch: Branch;
  canUpdate: boolean;
  canDeactivate: boolean;
  onComplete: (message: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const name = branch.branch_name;

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
    setDeactivateOpen(false);
    onComplete("Branch deactivated.");
  }

  return (
    <>
      <TableRow>
        <TableCell className="max-w-64 font-medium">
          <span className="block truncate" title={name}>
            {name}
          </span>
        </TableCell>
        <TableCell className="font-mono text-xs">{branch.code}</TableCell>
        <TableCell className="max-w-64">
          <span className="block truncate" title={branch.address ?? "—"}>
            {branch.address || "—"}
          </span>
        </TableCell>
        <TableCell>{branch.date_opened?.slice(0, 10) || "—"}</TableCell>
        <TableCell>
          {branch.has_dine_in ? "Available" : "Not available"}
        </TableCell>
        <TableCell>
          <Badge
            className={
              branch.status === "active"
                ? "bg-green-700 text-white"
                : "bg-red-700 text-white"
            }
          >
            {branch.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            {canUpdate && branch.status === "active" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Edit ${name}`}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            )}
            {canDeactivate && branch.status === "active" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                aria-label={`Deactivate ${name}`}
                onClick={() => {
                  setError("");
                  setDeactivateOpen(true);
                }}
              >
                Deactivate
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {editOpen && (
        <BranchEditorForm
          branch={branch}
          open={editOpen}
          onOpenChange={setEditOpen}
          onComplete={() => onComplete("Branch updated.")}
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (pending) return;
          setDeactivateOpen(open);
        }}
      >
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {name}?</AlertDialogTitle>
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
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
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
    </>
  );
}
