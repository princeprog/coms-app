import type { User } from "@/features/auth/types/auth.types";

export type PermissionedNavigationItem = {
  title: string;
  url: string;
  permission?: string;
};

function isProtectedSuperAdmin(user: User): boolean {
  return Boolean(
    user.role?.isActive &&
    user.role.isSystem &&
    user.role.code === "SUPER_ADMIN",
  );
}

export function hasPermission(user: User, permission: string): boolean {
  if (isProtectedSuperAdmin(user)) return true;
  if (user.role?.isSystem && user.role.code === "NO_ACCESS") return false;
  return user.permissions?.includes(permission) ?? false;
}

export function hasBranchScope(user: User, branchId: string): boolean {
  if (isProtectedSuperAdmin(user)) return true;
  if (user.role?.isSystem && user.role.code === "NO_ACCESS") return false;
  return user.branch_ids?.includes(branchId) ?? false;
}

export function filterNavigationForUser<T extends PermissionedNavigationItem>(
  user: User,
  items: T[],
): T[] {
  return items.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );
}
