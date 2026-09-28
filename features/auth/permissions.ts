import type { User } from "@/features/auth/types/auth.types";

export type PermissionedNavigationItem = {
  title: string;
  url: string;
  permission?: string | readonly string[];
};

const landingRoutes: { url: string; permissions: readonly string[] }[] = [
  {
    url: "/dashboard",
    permissions: ["dashboard.read", "dashboard.global_read"],
  },
  { url: "/pos", permissions: ["sales.create"] },
  {
    url: "/inventory",
    permissions: ["inventory.read", "inventory.commissary_read"],
  },
  { url: "/suppliers", permissions: ["suppliers.read"] },
  { url: "/stock-items", permissions: ["stock_items.read"] },
  { url: "/receipts", permissions: ["supplier_receipts.read"] },
  { url: "/dispatches", permissions: ["dispatches.read"] },
  { url: "/replenishment", permissions: ["stock_requests.read"] },
  { url: "/products", permissions: ["products.read"] },
  { url: "/recipes", permissions: ["recipes.read"] },
  { url: "/branch-products", permissions: ["branch_products.read"] },
  { url: "/reports", permissions: ["daily_reports.read"] },
  { url: "/branches", permissions: ["branches.read"] },
  { url: "/staff", permissions: ["staff.read"] },
  { url: "/roles", permissions: ["roles.read"] },
];

export function isProtectedSuperAdmin(user: User): boolean {
  return Boolean(
    user.role?.isActive &&
    user.role.isSystem &&
    user.role.code === "SUPER_ADMIN",
  );
}

export function hasPermission(user: User, permission: string): boolean {
  if (isProtectedSuperAdmin(user)) return true;
  if (!user.role?.isActive) return false;
  return user.permissions?.includes(permission) ?? false;
}

export function getAuthorizedLandingPath(user: User): string {
  return (
    landingRoutes.find(({ permissions }) =>
      permissions.some((permission) => hasPermission(user, permission)),
    )?.url ?? "/no-access"
  );
}

export function hasBranchScope(user: User, branchId: string): boolean {
  if (isProtectedSuperAdmin(user)) return true;
  if (!user.role?.isActive) return false;
  return user.branch_ids?.includes(branchId) ?? false;
}

export function filterNavigationForUser<T extends PermissionedNavigationItem>(
  user: User,
  items: T[],
): T[] {
  return items.filter(
    (item) =>
      !item.permission ||
      (typeof item.permission === "string"
        ? hasPermission(user, item.permission)
        : item.permission.some((permission) =>
            hasPermission(user, permission),
          )),
  );
}
