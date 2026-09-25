"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deactivateRoleAction } from "@/features/roles/services/role-actions";
import type {
  Role,
  RoleMutationResult,
} from "@/features/roles/types/role.types";

export function RoleDirectoryActions({
  role,
  canManage,
  canDeactivate,
  onComplete,
}: {
  role: Role;
  canManage: boolean;
  canDeactivate: boolean;
  onComplete: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deactivate() {
    setPending(true);
    setError("");
    let result: RoleMutationResult;
    try {
      result = await deactivateRoleAction(role.id);
    } catch {
      setError("COMS could not complete this change. Try again.");
      setPending(false);
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    onComplete();
  }

  const canDeactivateThisRole =
    canDeactivate && !role.is_system && role.is_active;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`More actions for ${role.role_name}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent data-coms-ui="operational" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={`/roles/${role.id}`} />}>
              {canManage ? "Manage role" : "View role"}
            </DropdownMenuItem>
            {canDeactivateThisRole && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setError("");
                  setConfirming(true);
                }}
              >
                Deactivate role
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) window.setTimeout(() => triggerRef.current?.focus(), 0);
        }}
      >
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {role.role_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Staff must be reassigned before this role can be deactivated.
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
