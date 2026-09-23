import "server-only";

import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import type {
  BranchProductBranchOption,
  BranchProductPage,
  BranchProductProductOption,
} from "@/features/branch-products/types/branch-product.types";
import { ApiRequestError } from "@/services/api-services";
import {
  createBranchProductsHref,
  parseBranchProductFilters,
  type BranchProductsSearchParams,
} from "./branch-product-page-params";
import {
  getActiveProductOptions,
  getBranchOptions,
  getBranchProductPageData,
} from "./branch-product-queries";

export type BranchProductsViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "branch-options-error" }
  | {
      status: "branch-products-error";
      branchOptions: BranchProductBranchOption[];
      selectedBranch: BranchProductBranchOption;
      filters: ReturnType<typeof parseBranchProductFilters>;
    }
  | { status: "redirect"; href: string }
  | {
      status: "branch-unavailable";
      branchOptions: BranchProductBranchOption[];
      filters: ReturnType<typeof parseBranchProductFilters>;
      message: string;
    }
  | {
      status: "ready";
      page: BranchProductPage;
      filters: ReturnType<typeof parseBranchProductFilters>;
      branchOptions: BranchProductBranchOption[];
      selectedBranch: BranchProductBranchOption;
      productOptions: BranchProductProductOption[];
      productOptionsUnavailable: boolean;
      canCreate: boolean;
      canUpdatePrice: boolean;
      canUpdateAvailability: boolean;
    };

function isProtectedSuperAdmin(user: User) {
  return Boolean(
    user.role?.isSystem &&
    user.role.isActive &&
    user.role.code === "SUPER_ADMIN",
  );
}

function getAccessFailure(
  error: unknown,
): { status: "forbidden" } | { status: "session-expired" } | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

function getAssignedBranchOptions(user: User): BranchProductBranchOption[] {
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

export async function loadBranchProductsView(
  user: User,
  searchParams: BranchProductsSearchParams,
): Promise<BranchProductsViewResult> {
  if (!hasPermission(user, "branch_products.read"))
    return { status: "forbidden" };

  const filters = parseBranchProductFilters(searchParams);
  const isSuperAdmin = isProtectedSuperAdmin(user);
  let branchOptions: BranchProductBranchOption[];
  if (hasPermission(user, "branches.read")) {
    try {
      const allBranches = await getBranchOptions();
      branchOptions = allBranches.filter((branch) =>
        hasBranchScope(user, branch.id),
      );
    } catch (error) {
      const accessFailure = getAccessFailure(error);
      if (accessFailure) return accessFailure;
      return { status: "branch-options-error" };
    }
  } else {
    branchOptions = getAssignedBranchOptions(user);
  }

  if (branchOptions.length === 0) {
    return {
      status: "branch-unavailable",
      branchOptions,
      filters,
      message: isSuperAdmin
        ? "Create a branch before configuring branch products."
        : "Ask an administrator to assign a branch before viewing branch products.",
    };
  }

  const selectedBranch = filters.requestedBranchId
    ? branchOptions.find(
        (branch) =>
          branch.id.toLowerCase() === filters.requestedBranchId?.toLowerCase(),
      )
    : branchOptions[0];
  if (!selectedBranch) return { status: "forbidden" };

  let page: BranchProductPage;
  try {
    page = await getBranchProductPageData({
      branchId: selectedBranch.id,
      page: filters.page,
      search: filters.search,
      isAvailable: filters.isAvailable,
    });
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    if (error instanceof ApiRequestError && error.status === 404) {
      return {
        status: "branch-unavailable",
        branchOptions,
        filters,
        message: "This branch is no longer available. Choose another branch.",
      };
    }
    return {
      status: "branch-products-error",
      branchOptions,
      selectedBranch,
      filters,
    };
  }

  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  if (filters.page > pageCount) {
    return {
      status: "redirect",
      href: createBranchProductsHref({
        branchId: selectedBranch.id,
        page: pageCount,
        search: filters.search,
        isAvailable: filters.isAvailable,
      }),
    };
  }

  const branchIsActive = selectedBranch.status !== "inactive";
  const canCreate =
    branchIsActive && hasPermission(user, "branch_products.create");
  const canUpdatePrice =
    branchIsActive && hasPermission(user, "branch_products.update");
  const canUpdateAvailability =
    branchIsActive &&
    hasPermission(user, "branch_products.availability_update");
  const productOptions: BranchProductProductOption[] = [];
  let productOptionsUnavailable = false;
  if (canCreate) {
    if (!hasPermission(user, "products.read")) {
      productOptionsUnavailable = true;
    } else {
      try {
        productOptions.push(...(await getActiveProductOptions()));
      } catch (error) {
        const accessFailure = getAccessFailure(error);
        if (accessFailure?.status === "session-expired") return accessFailure;
        productOptionsUnavailable = true;
      }
    }
  }

  return {
    status: "ready",
    page,
    filters,
    branchOptions,
    selectedBranch,
    productOptions,
    productOptionsUnavailable,
    canCreate,
    canUpdatePrice,
    canUpdateAvailability,
  };
}
