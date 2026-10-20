import "server-only";

import {
  hasBranchScope,
  hasPermission,
  isProtectedSuperAdmin,
} from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { getBranchOptions } from "@/features/branch-products/services/branch-product-queries";
import { getAssignedBranchOptions } from "@/features/sales/services/sales-page-state";
import { ApiRequestError } from "@/services/api-services";

export type ShiftPageAccess =
  | {
      status:
        | "forbidden"
        | "session-expired"
        | "branch-options-error"
        | "branch-unavailable";
    }
  | {
      status: "ready";
      branches: { id: string; name: string }[];
      selectedBranchId: string;
      currentUserId: string;
      canReview: boolean;
      canOperate: boolean;
      superAdmin: boolean;
    };

export async function loadShiftPageAccess(
  user: User,
  requestedBranch: string | undefined,
): Promise<ShiftPageAccess> {
  if (!hasPermission(user, "shifts.read")) return { status: "forbidden" };
  let branches: { id: string; name: string }[];
  try {
    branches = hasPermission(user, "branches.read")
      ? (await getBranchOptions()).filter((branch) =>
          hasBranchScope(user, branch.id),
        )
      : getAssignedBranchOptions(user);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401)
      return { status: "session-expired" };
    if (error instanceof ApiRequestError && error.status === 403)
      return { status: "forbidden" };
    return { status: "branch-options-error" };
  }
  if (!branches.length) return { status: "branch-unavailable" };
  const selected =
    branches.find(
      (branch) => branch.id.toLowerCase() === requestedBranch?.toLowerCase(),
    ) ?? branches[0];
  return {
    status: "ready",
    branches: branches.map(({ id, name }) => ({ id, name })),
    selectedBranchId: selected.id,
    currentUserId: user.id,
    canReview: hasPermission(user, "shifts.review"),
    canOperate:
      hasPermission(user, "shifts.operate") && !isProtectedSuperAdmin(user),
    superAdmin: isProtectedSuperAdmin(user),
  };
}
