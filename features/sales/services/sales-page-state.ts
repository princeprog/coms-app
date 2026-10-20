import type { User } from "@/features/auth/types/auth.types";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type { BranchMenuCategory } from "@/features/branch-products/schemas/branch-product.schema";
import { ApiRequestError } from "@/services/api-services";
import type { Sale, SalePage, SalesMenuPage } from "../types/sale.types";
import type { parseSalesPageFilters } from "./sales-page-params";

export type Captured<T> = { data: T } | { error: unknown };

export type SalesViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "branch-options-error" }
  | { status: "branch-unavailable" }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      filters: ReturnType<typeof parseSalesPageFilters>;
      branchOptions: BranchProductBranchOption[];
      selectedBranch: BranchProductBranchOption;
      menuPage: SalesMenuPage | null;
      categories: BranchMenuCategory[];
      categoriesUnavailable: boolean;
      menuIssue: "permissions" | "unavailable" | "inactive" | null;
      salesPage: SalePage | null;
      historyIssue: "permissions" | "unavailable" | null;
      selectedSale: Sale | null;
      detailIssue: "permissions" | "not-found" | "unavailable" | null;
      canCreate: boolean;
      canRead: boolean;
      canVoid: boolean;
      currentUserId: string;
      canOperateShift: boolean;
      canReviewShift: boolean;
    };

export function getAccessFailure(
  error: unknown,
): { status: "forbidden" } | { status: "session-expired" } | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

export function getAssignedBranchOptions(
  user: User,
): BranchProductBranchOption[] {
  const branchIds = user.branch_ids ?? [];
  return branchIds.map((id, index) => ({
    id: id.toLowerCase(),
    name:
      branchIds.length === 1
        ? "Assigned branch"
        : `Assigned branch ${index + 1}`,
    status: "unknown",
  }));
}

export async function capture<T>(
  request: () => Promise<T>,
): Promise<Captured<T>> {
  try {
    return { data: await request() };
  } catch (error) {
    return { error };
  }
}
