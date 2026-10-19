"use client";

import { useState, type RefObject } from "react";
import { StaffStatusBadge } from "./staff-status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export function StaffManagementSheet({
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
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <SheetContent
        data-coms-ui="operational"
        side="right"
        className="h-full w-full gap-0 overflow-hidden sm:max-w-2xl"
      >
        <SheetHeader className="gap-3 border-b px-6 py-6">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-xl wrap-anywhere">
              {staff.full_name}
            </SheetTitle>
            <StaffStatusBadge active={staff.is_active} />
          </div>
          <SheetDescription className="wrap-anywhere">
            {staff.email} · {staff.role_name ?? "Unassigned"}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 [&_input]:h-10 [&_[data-slot=select-trigger]]:h-10 [&_summary]:py-1 [&_summary]:text-sm">
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

        <SheetFooter className="mt-0 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={requestClose}
          >
            Close staff details
          </Button>
        </SheetFooter>
      </SheetContent>
      <StaffDiscardConfirmation
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={resetAndClose}
      />
    </Sheet>
  );
}
