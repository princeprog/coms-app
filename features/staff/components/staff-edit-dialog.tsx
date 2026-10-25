"use client";

import { useState, type RefObject } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffProfileForm } from "./staff-profile-form";
import { StaffRoleForm } from "./staff-role-form";
import { StaffBranchAssignmentForm } from "./staff-branch-assignment-form";
import { StaffDiscardConfirmation } from "./staff-discard-confirmation";
import type { Role } from "@/features/roles/types/role.types";
import type { StaffBranchOption, StaffMember } from "../types/staff.types";

export type StaffEditAction = "profile" | "role" | "branches";
const titles: Record<StaffEditAction, string> = {
  profile: "Edit profile",
  role: "Assign role",
  branches: "Manage branch assignments",
};

export function StaffEditDialog({
  action,
  staff,
  branches,
  roles,
  rolesFailed,
  branchId,
  onClose,
  triggerRef,
}: {
  action: StaffEditAction;
  staff: StaffMember;
  branches: StaffBranchOption[];
  roles: Role[];
  rolesFailed: boolean;
  branchId?: string;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  function requestClose() {
    if (pending) return;
    if (dirty) setDiscardOpen(true);
    else onClose();
  }
  const formProps = {
    staff,
    branchId,
    onDirtyChange: setDirty,
    onPendingChange: setPending,
    onComplete: onClose,
    onCancel: requestClose,
  };
  return (
    <Dialog open onOpenChange={(next) => !next && requestClose()}>
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        finalFocus={triggerRef}
        overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-none"
        className="flex max-h-[90dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="relative shrink-0 gap-2 px-5 pt-6 pb-5 sm:px-8 sm:pt-7">
          <DialogTitle className="pr-8 text-xl font-semibold">
            {titles[action]}
          </DialogTitle>
          <DialogDescription className="wrap-anywhere">
            {staff.full_name} · {staff.email}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-5 right-5 sm:right-7"
            aria-label={`Close ${titles[action].toLowerCase()}`}
            disabled={pending}
            onClick={requestClose}
          >
            <X />
          </Button>
        </DialogHeader>
        {action === "profile" && <StaffProfileForm {...formProps} />}
        {action === "role" && (
          <StaffRoleForm
            {...formProps}
            roles={roles}
            rolesFailed={rolesFailed}
          />
        )}
        {action === "branches" && (
          <StaffBranchAssignmentForm {...formProps} branches={branches} />
        )}
      </DialogContent>
      <StaffDiscardConfirmation
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={onClose}
      />
    </Dialog>
  );
}
