import "server-only";

import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import {
  getBranchOptions,
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

type Captured<T> = { data: T } | { error: unknown };

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
      menuIssue: "permissions" | "unavailable" | "inactive" | null;
      salesPage: SalePage | null;
      historyIssue: "permissions" | "unavailable" | null;
      selectedSale: Sale | null;
      detailIssue: "permissions" | "not-found" | "unavailable" | null;
      canCreate: boolean;
      canRead: boolean;
      canVoid: boolean;
    };

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

async function capture<T>(request: () => Promise<T>): Promise<Captured<T>> {
  try {
    return { data: await request() };
  } catch (error) {
    return { error };
  }
}

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

  const [menuResult, historyResult, detailResult] = await Promise.all([
    canCreateAtBranch && canReadMenu
      ? capture(() =>
          getBranchProductPageData({
            branchId: selectedBranch.id,
            page: filters.page,
            search: filters.search,
            isAvailable: true,
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
  ]);

  for (const result of [menuResult, historyResult, detailResult]) {
    if ("error" in result) {
      const accessFailure = getAccessFailure(result.error);
      if (accessFailure) return accessFailure;
    }
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
    menuIssue: resolvedMenuIssue,
    salesPage,
    historyIssue,
    selectedSale,
    detailIssue,
    canCreate: canCreateAtBranch && canReadMenu && menuPage !== null,
    canRead,
    canVoid,
  };
}
