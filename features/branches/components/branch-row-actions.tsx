"use client";
import { useState } from "react";
import { MoreVertical, Power, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BranchEditorForm } from "./branch-editor-form";
import { BranchDeactivateDialog } from "./branch-deactivate-dialog";
import type { Branch } from "../types/branch.types";

export function BranchRowActions({
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
  const canDisable = canDeactivate && branch.status === "active";
  if (!canUpdate && !canDisable) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-11 sm:size-9"
              aria-label={`Actions for ${branch.branch_name}`}
            />
          }
        >
          <MoreVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {canUpdate && (
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <SquarePen
                  aria-hidden="true"
                  className="stroke-blue-600 dark:stroke-blue-400"
                />
                Edit branch
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          {canUpdate && canDisable && <DropdownMenuSeparator />}
          {canDisable && (
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeactivateOpen(true)}
              >
                <Power aria-hidden="true" className="stroke-destructive" />
                Deactivate branch
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {editOpen && (
        <BranchEditorForm
          branch={branch}
          open={editOpen}
          onOpenChange={setEditOpen}
          onComplete={() => onComplete("Branch updated.")}
        />
      )}
      {deactivateOpen && (
        <BranchDeactivateDialog
          branch={branch}
          onOpenChange={setDeactivateOpen}
          onComplete={() => onComplete("Branch deactivated.")}
        />
      )}
    </>
  );
}
