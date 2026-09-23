import type { User } from "@/features/auth/types/auth.types";

export type PermissionedNavigationItem = {
  title: string;
  url: string;
  permission?: string;
};

export function hasPermission(user: User, permission: string): boolean {
  if (
    user.role?.isActive &&
    user.role.isSystem &&
    user.role.code === "SUPER_ADMIN"
  ) {
    return true;
  }
  if (user.role?.isSystem && user.role.code === "NO_ACCESS") return false;
  return user.permissions?.includes(permission) ?? false;
}

export function filterNavigationForUser<T extends PermissionedNavigationItem>(
  user: User,
  items: T[],
): T[] {
  return items.filter(
    (item) => !item.permission || hasPermission(user, item.permission),
  );
}
