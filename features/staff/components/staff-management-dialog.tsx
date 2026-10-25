"use client";

import { useState, type RefObject } from "react";
import { XIcon } from "lucide-react";
import { StaffStatusBadge } from "./staff-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffDiscardConfirmation } from "@/features/staff/components/staff-discard-confirmation";
import { StaffMemberActions } from "@/features/staff/components/staff-member-actions";
import type { Role } from "@/features/roles/types/role.types";
import type {
  StaffBranchOption,
  StaffManagementPermissions,
  StaffMember,
} from "@/features/staff/types/staff.types";

type EditSection = "profile" | "role" | "branches";
type SectionChanges = Record<EditSection, boolean>;

export function StaffManagementDialog({
  staff,
  branches,
  roles,
  rolesFailed,
  branchId,
  currentUserId,
  isSuperAdmin,
  permissions,
  open,
  onOpenChange,
  triggerRef,
}: {
  staff: StaffMember;
  branches: StaffBranchOption[];
  roles: Role[];
  rolesFailed: boolean;
  branchId?: string;
  currentUserId: string;
  isSuperAdmin: boolean;
  permissions: StaffManagementPermissions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const [changes, setChanges] = useState<SectionChanges>({
    profile: false,
    role: false,
    branches: false,
  });
  const [pendingSections, setPendingSections] = useState<SectionChanges>({
    profile: false,
    role: false,
    branches: false,
  });
  const [discardOpen, setDiscardOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const isDirty = Object.values(changes).some(Boolean);
  const isPending = Object.values(pendingSections).some(Boolean);
  const branchNames = new Map(
    branches.map((branch) => [branch.id, branch.name]),
  );

  function resetAndClose() {
    setDiscardOpen(false);
    setChanges({ profile: false, role: false, branches: false });
    setPendingSections({ profile: false, role: false, branches: false });
    setFormVersion((version) => version + 1);
    onOpenChange(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function requestClose() {
    if (isPending) return;
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    resetAndClose();
  }

  function updateChange(section: EditSection, dirty: boolean) {
    setChanges((current) => ({ ...current, [section]: dirty }));
  }

  function updatePending(section: EditSection, pending: boolean) {
    setPendingSections((current) => ({ ...current, [section]: pending }));
  }

  const assignedBranches = staff.branch_ids.map(
    (id) => branchNames.get(id) ?? `Branch ${id.slice(0, 8)}`,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestClose()}
    >
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        finalFocus={triggerRef}
        overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-none"
        className="flex max-h-[min(90dvh,48rem)] w-full min-h-0 flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-2xl"
      >
        <DialogHeader className="relative shrink-0 gap-3 px-5 pt-6 pb-5 sm:px-8 sm:pt-7">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <DialogTitle className="text-2xl font-semibold wrap-anywhere">
              {staff.full_name}
            </DialogTitle>
            <StaffStatusBadge active={staff.is_active} />
          </div>
          <DialogDescription className="wrap-anywhere">
            {staff.email} · {staff.role_name ?? "Unassigned"}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-5 right-5 rounded-md sm:right-7"
            aria-label="Close staff details"
            disabled={isPending}
            onClick={requestClose}
          >
            <XIcon />
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-7 sm:px-8 [&_input]:h-10 [&_[data-slot=select-trigger]]:h-10 [&_summary]:py-1 [&_summary]:text-sm">
          <section aria-label={`Staff details for ${staff.full_name}`}>
            <h3 className="mb-3 text-sm font-medium">Account details</h3>
            <dl className="grid gap-5 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Contact number
                </dt>
                <dd className="mt-1.5 font-medium wrap-anywhere">
                  {staff.contact_number}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Branch access</dt>
                <dd className="mt-1.5 font-medium wrap-anywhere">
                  {assignedBranches.length > 0
                    ? assignedBranches.join(", ")
                    : "None assigned"}
                </dd>
              </div>
            </dl>
          </section>

          <StaffMemberActions
            key={formVersion}
            staff={staff}
            branches={branches}
            roles={roles}
            rolesFailed={rolesFailed}
            branchId={branchId}
            currentUserId={currentUserId}
            isSuperAdmin={isSuperAdmin}
            permissions={permissions}
            onDirtyChange={updateChange}
            onPendingChange={updatePending}
          />
          {!permissions.canUpdate &&
            !permissions.canAssignRole &&
            !permissions.canAssignBranches &&
            !permissions.canDeactivate && (
              <p className="text-sm text-muted-foreground">
                You can view this account but do not have access to change it.
              </p>
            )}
        </div>

        <DialogFooter className="m-0 shrink-0 px-5 py-4 sm:px-8">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={requestClose}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
      <StaffDiscardConfirmation
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={resetAndClose}
      />
    </Dialog>
  );
}
