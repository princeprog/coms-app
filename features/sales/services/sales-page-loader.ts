import "server-only";

import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import {
  getBranchOptions,
  getBranchMenuCategories,
  getBranchProductPageData,
} from "@/features/branch-products/services/branch-product-queries";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import { ApiRequestError } from "@/services/api-services";
import type {
  Sale,
  SalePage,
  SalesMenuPage,
} from "@/features/sales/types/sale.types";
import { getSaleDetailData, getSalePageData } from "./sales-queries";
import {
  createSalesHref,
  parseSalesPageFilters,
  type SalesPageSearchParams,
} from "./sales-page-params";

import type { BranchMenuCategory } from "@/features/branch-products/schemas/branch-product.schema";

import {
  capture,
  getAccessFailure,
  getAssignedBranchOptions,
  type Captured,
  type SalesViewResult,
} from "./sales-page-state";
export type { SalesViewResult } from "./sales-page-state";

export async function loadSalesView(
  user: User,
  searchParams: SalesPageSearchParams,
): Promise<SalesViewResult> {
  const canCreate = hasPermission(user, "sales.create");
  const canRead = hasPermission(user, "sales.read");
  if (!canCreate && !canRead) return { status: "forbidden" };

  const filters = parseSalesPageFilters(searchParams);
  let branchOptions: BranchProductBranchOption[];
  if (hasPermission(user, "branches.read")) {
    try {
      const allBranches = await getBranchOptions();
      branchOptions = allBranches.filter((branch) =>
        hasBranchScope(user, branch.id),
      );
    } catch (error) {
      const accessFailure = getAccessFailure(error);
      return accessFailure ?? { status: "branch-options-error" };
    }
  } else {
    branchOptions = getAssignedBranchOptions(user);
  }
  if (branchOptions.length === 0) return { status: "branch-unavailable" };

  const selectedBranch = filters.branchId
    ? branchOptions.find(
        (branch) => branch.id.toLowerCase() === filters.branchId,
      )
    : branchOptions[0];
  if (!selectedBranch) return { status: "forbidden" };

  const branchIsActive = selectedBranch.status !== "inactive";
  const canCreateAtBranch = canCreate && branchIsActive;
  const canVoid = hasPermission(user, "sales.void") && branchIsActive;
  const canReadMenu = hasPermission(user, "branch_products.read");
  const menuIssue: "permissions" | "unavailable" | "inactive" | null =
    !canCreateAtBranch
      ? canCreate && !branchIsActive
        ? "inactive"
        : null
      : !canReadMenu
        ? "permissions"
        : null;

  const [menuResult, historyResult, detailResult, categoriesResult] =
    await Promise.all([
      canCreateAtBranch && canReadMenu
        ? capture(() =>
            getBranchProductPageData({
              pageSize: 25,
              branchId: selectedBranch.id,
              page: filters.page,
              search: filters.search,
              isAvailable: true,
              eligibleOnly: true,
              ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
              ...(filters.serviceType
                ? { serviceType: filters.serviceType }
                : {}),
            }),
          )
        : Promise.resolve({ data: null } as Captured<SalesMenuPage | null>),
      canRead
        ? capture(() =>
            getSalePageData({
              branchId: selectedBranch.id,
              page: filters.historyPage,
            }),
          )
        : Promise.resolve({ data: null } as Captured<SalePage | null>),
      filters.saleId && canRead
        ? capture(() => getSaleDetailData(selectedBranch.id, filters.saleId!))
        : Promise.resolve({ data: null } as Captured<Sale | null>),
      canCreateAtBranch && canReadMenu
        ? capture(() =>
            getBranchMenuCategories(selectedBranch.id, filters.serviceType),
          )
        : Promise.resolve({ data: [] } as Captured<BranchMenuCategory[]>),
    ]);

  for (const result of [
    menuResult,
    historyResult,
    detailResult,
    categoriesResult,
  ]) {
    if ("error" in result) {
      const accessFailure = getAccessFailure(result.error);
      if (accessFailure) return accessFailure;
    }
  }

  const categories = "data" in categoriesResult ? categoriesResult.data : [];
  if (
    canCreateAtBranch &&
    canReadMenu &&
    "data" in categoriesResult &&
    filters.categoryId &&
    !categories.some((category) => category.id === filters.categoryId)
  ) {
    return {
      status: "redirect",
      href: createSalesHref({ ...filters, categoryId: undefined, page: 1 }),
    };
  }

  let resolvedMenuIssue: "permissions" | "unavailable" | "inactive" | null =
    menuIssue;
  let menuPage: SalesMenuPage | null = null;
  if ("data" in menuResult) {
    menuPage = menuResult.data;
    if (menuPage) {
      const pageCount = Math.max(
        1,
        Math.ceil(menuPage.total / menuPage.page_size),
      );
      if (filters.page > pageCount)
        return {
          status: "redirect",
          href: createSalesHref({ ...filters, page: pageCount }),
        };
    }
  } else {
    resolvedMenuIssue = "unavailable";
  }

  let historyIssue: "permissions" | "unavailable" | null = canRead
    ? null
    : "permissions";
  let salesPage: SalePage | null = null;
  if ("data" in historyResult) {
    salesPage = historyResult.data;
    if (salesPage) {
      const pageCount = Math.max(
        1,
        Math.ceil(salesPage.total / salesPage.page_size),
      );
      if (filters.historyPage > pageCount)
        return {
          status: "redirect",
          href: createSalesHref({ ...filters, historyPage: pageCount }),
        };
    }
  } else {
    historyIssue = "unavailable";
  }

  let detailIssue: "permissions" | "not-found" | "unavailable" | null =
    filters.saleId && !canRead ? "permissions" : null;
  let selectedSale: Sale | null = null;
  if ("data" in detailResult) {
    selectedSale = detailResult.data;
  } else if (detailResult.error instanceof ApiRequestError) {
    detailIssue =
      detailResult.error.status === 404 ? "not-found" : "unavailable";
  } else {
    detailIssue = "unavailable";
  }

  return {
    status: "ready",
    filters,
    branchOptions,
    selectedBranch,
    menuPage,
    categories,
    categoriesUnavailable: "error" in categoriesResult,
    menuIssue: resolvedMenuIssue,
    salesPage,
    historyIssue,
    selectedSale,
    detailIssue,
    canCreate: canCreateAtBranch && canReadMenu,
    canRead,
    canVoid,
  };
}
