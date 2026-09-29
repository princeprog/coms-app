"use client";

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BranchDiscardConfirmation } from "@/features/branches/components/branch-discard-confirmation";
import { BranchLocationFields } from "@/features/branches/components/branch-location-fields";
import { createBranchAction } from "@/features/branches/services/branch-actions";
import type { BranchCreateResult } from "@/features/branches/types/branch.types";

export function BranchCreateForm({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (code: string) => void;
}) {
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOpened, setDateOpened] = useState("");
  const [hasDineIn, setHasDineIn] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty = Boolean(branchName || address || dateOpened || hasDineIn);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    let result: BranchCreateResult;
    try {
      result = await createBranchAction({
        branch_name: branchName,
        address: address.trim() || null,
        date_opened: dateOpened || null,
        has_dine_in: hasDineIn,
      });
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
    setBranchName("");
    setAddress("");
    setDateOpened("");
    setHasDineIn(false);
    onOpenChange(false);
    onComplete(result.code);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        requestClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Create branch</DialogTitle>
          <DialogDescription>
            Add a location and its basic operating details. COMS assigns the
            branch code automatically.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <BranchLocationFields
            idPrefix="branch-create"
            branchName={branchName}
            address={address}
            dateOpened={dateOpened}
            hasDineIn={hasDineIn}
            disabled={pending}
            useDatePicker
            onBranchNameChange={setBranchName}
            onAddressChange={setAddress}
            onDateOpenedChange={setDateOpened}
            onHasDineInChange={setHasDineIn}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating branch…" : "Create branch"}
            </Button>
          </DialogFooter>
        </form>
        <BranchDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={() => {
            setDiscardOpen(false);
            setBranchName("");
            setAddress("");
            setDateOpened("");
            setHasDineIn(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
