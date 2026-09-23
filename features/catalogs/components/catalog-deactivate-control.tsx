"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type {
  CatalogDeactivateAction,
  CatalogMutationResult,
} from "@/features/catalogs/types/catalog.types";

export function CatalogDeactivateControl({
  recordId,
  recordName,
  resourceName,
  action,
  onComplete,
}: {
  recordId: string;
  recordName: string;
  resourceName: string;
  action: CatalogDeactivateAction;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deactivate() {
    setError("");
    setPending(true);
    let result: CatalogMutationResult;
    try {
      result = await action(recordId);
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
    setOpen(false);
    onComplete();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (nextOpen) setError("");
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            aria-label={`Deactivate ${recordName}`}
          >
            Deactivate {resourceName}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {recordName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordName} will be marked inactive and omitted from active catalog
            results.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void deactivate();
            }}
          >
            {pending ? "Deactivating…" : `Confirm deactivation`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
