"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffCreateForm } from "@/features/staff/components/staff-create-form";
import { StaffDiscardConfirmation } from "@/features/staff/components/staff-discard-confirmation";
import type { Role } from "@/features/roles/types/role.types";
import type { StaffBranchOption } from "@/features/staff/types/staff.types";

export function StaffCreateSection({
  roles,
  branches,
  initialBranchId,
  canReadRoles,
  rolesFailed,
}: {
  roles: Role[];
  branches: StaffBranchOption[];
  initialBranchId?: string;
  canReadRoles: boolean;
  rolesFailed: boolean;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [status, setStatus] = useState("");

  if (roles.length === 0) {
    const message = !canReadRoles
      ? "Staff creation requires access to read the role catalog."
      : rolesFailed
        ? "COMS could not load account roles. Try again."
        : "Activate an assignable role before creating staff accounts.";

    return (
      <div className="flex flex-wrap items-center gap-2">
        <p
          role={rolesFailed ? "alert" : "status"}
          className="text-sm text-muted-foreground"
        >
          {message}
        </p>
        {rolesFailed && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => router.refresh()}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  function closeCreate() {
    setOpen(false);
    setDirty(false);
    setPending(false);
    setDiscardOpen(false);
    setFormVersion((version) => version + 1);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    closeCreate();
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setStatus("");
          setOpen(true);
        }}
      >
        Add staff
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      >
        <DialogContent
          data-coms-ui="operational"
          showCloseButton={false}
          overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-none"
          className="flex max-h-[min(90dvh,48rem)] w-full min-h-0 flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[44rem]"
        >
          <DialogHeader className="relative shrink-0 gap-1 px-5 pt-6 pb-1 sm:px-8 sm:pt-7">
            <DialogTitle className="pr-10 text-2xl font-semibold">
              Add staff
            </DialogTitle>
            <DialogDescription className="pr-10">
              Create an account and assign role and branch access.
            </DialogDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-5 right-5 rounded-md sm:right-7"
              aria-label="Close Add staff"
              disabled={pending}
              onClick={requestClose}
            >
              <XIcon />
            </Button>
          </DialogHeader>
          <StaffCreateForm
            key={formVersion}
            roles={roles}
            branches={branches}
            initialBranchId={initialBranchId}
            onDirtyChange={setDirty}
            onPendingChange={setPending}
            onCancel={requestClose}
            onComplete={() => {
              setStatus("Staff account created.");
              closeCreate();
            }}
          />
        </DialogContent>
        <StaffDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={closeCreate}
        />
      </Dialog>
      {status && (
        <p role="status" aria-live="polite" className="sr-only">
          {status}
        </p>
      )}
    </>
  );
}
