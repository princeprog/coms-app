"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      >
        <SheetContent
          data-coms-ui="operational"
          side="right"
          className="h-full w-full gap-0 overflow-hidden sm:max-w-2xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Add a staff account</SheetTitle>
            <SheetDescription>
              Set the initial profile, a least-privilege role, and branch
              access. The initial password is never shown after creation.
            </SheetDescription>
          </SheetHeader>
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
        </SheetContent>
        <StaffDiscardConfirmation
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          onDiscard={closeCreate}
        />
      </Sheet>
      {status && (
        <p role="status" aria-live="polite" className="sr-only">
          {status}
        </p>
      )}
    </>
  );
}
