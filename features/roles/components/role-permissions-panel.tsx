import { RolePermissionPicker } from "@/features/roles/components/role-permission-picker";
import { RolePermissionsCard } from "@/features/roles/components/role-permissions-card";
import { RolePermissionsForm } from "@/features/roles/components/role-permissions-form";
import type { Permission, Role } from "@/features/roles/types/role.types";

export function RolePermissionsPanel({
  role,
  permissions,
  canUpdate,
  disabled,
  onComplete,
  onDirtyChange,
  onPendingChange,
  onSelectedCountChange,
}: {
  role: Role;
  permissions: Permission[];
  canUpdate: boolean;
  disabled: boolean;
  onComplete: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
  onSelectedCountChange: (count: number) => void;
}) {
  return (
    <RolePermissionsCard description={getDescription(role, canUpdate)}>
      {canUpdate ? (
        <RolePermissionsForm
          roleId={role.id}
          roleName={role.role_name}
          permissions={permissions}
          initialPermissions={role.permission_keys}
          disabled={disabled}
          onComplete={onComplete}
          onDirtyChange={onDirtyChange}
          onPendingChange={onPendingChange}
          onSelectedCountChange={onSelectedCountChange}
        />
      ) : (
        <div className="min-h-0 min-w-0 flex-1">
          <RolePermissionPicker
            permissions={permissions}
            selected={role.permission_keys}
            labelPrefix={role.role_name}
            idPrefix={`role-${role.id}`}
            disabled
            onChange={() => {}}
          />
        </div>
      )}
    </RolePermissionsCard>
  );
}

function getDescription(role: Role, canUpdate: boolean) {
  if (role.code === "SUPER_ADMIN") {
    return "This protected system role has global access across COMS.";
  }
  if (role.code === "NO_ACCESS") {
    return "This protected system role has no grants.";
  }
  if (canUpdate) {
    return "Choose what members of this role can view and manage.";
  }
  if (!role.is_active) return "Inactive roles cannot be edited.";
  if (role.is_system) return "System roles are protected and cannot be edited.";
  return "Review the fixed permission catalog for this role.";
}
