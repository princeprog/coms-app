"use client";

import { useRef, useState } from "react";
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
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  CatalogDeactivateAction,
  CatalogMutationResult,
  CatalogRecord,
} from "@/features/catalogs/types/catalog.types";

export function CatalogRowActions({
  record,
  recordName,
  canUpdate,
  canDeactivate,
  onView,
  onEdit,
  onDeactivated,
  deactivateAction,
}: {
  record: CatalogRecord;
  recordName: string;
  canUpdate: boolean;
  canDeactivate: boolean;
  onView: () => void;
  onEdit: () => void;
  onDeactivated: () => void;
  deactivateAction: CatalogDeactivateAction;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const canDeactivateRecord = canDeactivate && record.is_active;

  async function deactivate() {
    setError("");
    setPending(true);
    let result: CatalogMutationResult;
    try {
      result = await deactivateAction(record.id);
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
    setConfirming(false);
    onDeactivated();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

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
              aria-label={`More actions for ${recordName}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent data-coms-ui="operational" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onView}>View details</DropdownMenuItem>
            {canUpdate && (
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {canDeactivateRecord && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setError("");
                    setConfirming(true);
                  }}
                >
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (pending) return;
          setConfirming(open);
          if (!open) {
            window.setTimeout(() => triggerRef.current?.focus(), 0);
          }
        }}
      >
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {recordName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordName} will be marked inactive and omitted from active
              catalog results.
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
