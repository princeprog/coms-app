"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OperationalEmptyState,
  OperationalPageIntro,
} from "@/components/shared/operational-page-ui";
import { RoleCreateForm } from "@/features/roles/components/role-create-form";
import { RoleDiscardConfirmation } from "@/features/roles/components/role-discard-confirmation";
import { RoleEditorSheet } from "@/features/roles/components/role-editor-sheet";
import { RoleTable } from "@/features/roles/components/role-table";
import type { Permission, Role } from "@/features/roles/types/role.types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function RolesManagement({
  roles,
  permissions,
  canCreateRole,
  canUpdateRole,
  canUpdatePermissions,
  canDeactivateRole,
}: {
  roles: Role[];
  permissions: Permission[];
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canUpdatePermissions: boolean;
  canDeactivateRole: boolean;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormVersion, setCreateFormVersion] = useState(0);
  const [createDirty, setCreateDirty] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [confirmDiscardCreate, setConfirmDiscardCreate] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const activeCount = roles.filter((role) => role.is_active).length;
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const refresh = () => router.refresh();

  function closeCreate() {
    setCreateOpen(false);
    setCreateFormVersion((version) => version + 1);
    setCreateDirty(false);
    setCreatePending(false);
    setConfirmDiscardCreate(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function requestCloseCreate() {
    if (createPending) return;
    if (createDirty) {
      setConfirmDiscardCreate(true);
      return;
    }
    closeCreate();
  }

  function closeSelectedRole() {
    setSelectedRoleId(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  function openRole(role: Role, trigger: HTMLButtonElement | null) {
    returnFocusRef.current = trigger;
    setSelectedRoleId(role.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <OperationalPageIntro
        description="Define staff access with fixed permissions. System roles stay protected, and missing grants deny access."
        count={
          <div className="flex flex-wrap gap-2" aria-label="Role counts">
            <Badge variant="outline">{roles.length} roles</Badge>
            <Badge variant="outline">{activeCount} active</Badge>
          </div>
        }
        actions={
          canCreateRole ? (
            <Button
              type="button"
              onClick={(event) => {
                returnFocusRef.current = event.currentTarget;
                setCreateOpen(true);
              }}
            >
              Create role
            </Button>
          ) : undefined
        }
      />

      {roles.length === 0 ? (
        <OperationalEmptyState
          title="No roles available"
          description="There are no roles to display in this account scope."
        />
      ) : (
        <RoleTable
          roles={roles}
          canUpdateRole={canUpdateRole}
          canUpdatePermissions={canUpdatePermissions}
          canDeactivateRole={canDeactivateRole}
          onOpen={openRole}
          onComplete={refresh}
        />
      )}

      <Sheet
        open={createOpen}
        onOpenChange={(open) => !open && requestCloseCreate()}
      >
        <SheetContent
          data-coms-ui="operational"
          side="right"
          className="h-full w-full gap-0 overflow-y-auto sm:max-w-2xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Create a role</SheetTitle>
            <SheetDescription>
              Create a custom role and grant only the actions staff need.
            </SheetDescription>
          </SheetHeader>
          <RoleCreateForm
            key={createFormVersion}
            permissions={permissions}
            onCancel={requestCloseCreate}
            onDirtyChange={setCreateDirty}
            onPendingChange={setCreatePending}
            onComplete={() => {
              closeCreate();
              refresh();
            }}
          />
        </SheetContent>
      </Sheet>
      <RoleDiscardConfirmation
        open={confirmDiscardCreate}
        onOpenChange={setConfirmDiscardCreate}
        onDiscard={closeCreate}
      />

      {selectedRole && (
        <RoleEditorSheet
          key={selectedRole.id}
          role={selectedRole}
          permissions={permissions}
          canUpdateRole={canUpdateRole}
          canUpdatePermissions={canUpdatePermissions}
          onComplete={refresh}
          onClose={closeSelectedRole}
        />
      )}
    </div>
  );
}
