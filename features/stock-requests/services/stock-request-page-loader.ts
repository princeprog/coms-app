import "server-only";

import { hasBranchScope, hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import type {
  StockRequest,
  StockRequestFormOptions,
  StockRequestPage,
} from "@/features/stock-requests/types/stock-request.types";
import {
  createStockRequestHref,
  parseStockRequestPageFilters,
  type StockRequestPageSearchParams,
} from "./stock-request-page-params";
import {
  getStockRequestDetail,
  getStockRequestFormOptions,
  getStockRequestPageData,
} from "./stock-request-queries";

export type StockRequestIndexViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "list-error" }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      page: StockRequestPage;
      filters: ReturnType<typeof parseStockRequestPageFilters>;
      canCreate: boolean;
      canApprove: boolean;
      canReject: boolean;
      canCancel: boolean;
      formOptions: StockRequestFormOptions | null;
      formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
    };

export type StockRequestDetailViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "not-found" }
  | { status: "detail-error" }
  | {
      status: "ready";
      request: StockRequest;
      canApprove: boolean;
      canReject: boolean;
      canCancel: boolean;
    };

function isSuperAdmin(user: User) {
  return Boolean(
    user.role?.isActive &&
    user.role.isSystem &&
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

export async function loadStockRequestIndexView(
  user: User,
  searchParams: StockRequestPageSearchParams,
): Promise<StockRequestIndexViewResult> {
  if (!hasPermission(user, "stock_requests.read"))
    return { status: "forbidden" };

  const filters = parseStockRequestPageFilters(searchParams);
  if (filters.branch_id !== "all" && !hasBranchScope(user, filters.branch_id)) {
    return { status: "forbidden" };
  }

  let page: StockRequestPage;
  try {
    page = await getStockRequestPageData({
      page: filters.page,
      ...(filters.branch_id !== "all" ? { branch_id: filters.branch_id } : {}),
      ...(filters.status !== "all" ? { status: filters.status } : {}),
    });
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    return { status: "list-error" };
  }

  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  if (filters.page > pageCount)
    return {
      status: "redirect",
      href: createStockRequestHref({ ...filters, page: pageCount }),
    };

  const canCreate = hasPermission(user, "stock_requests.create");
  let formOptions: StockRequestFormOptions | null = null;
  let formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null =
    null;
  if (canCreate) {
    if (
      !hasPermission(user, "branches.read") ||
      !hasPermission(user, "stock_items.read")
    ) {
      formOptionsIssue = "permissions";
    } else {
      const branchIds = isSuperAdmin(user) ? null : (user.branch_ids ?? []);
      try {
        formOptions = await getStockRequestFormOptions(branchIds);
      } catch (error) {
        const accessFailure = getAccessFailure(error);
        if (accessFailure?.status === "session-expired") return accessFailure;
        formOptionsIssue =
          accessFailure?.status === "forbidden" ? "forbidden" : "unavailable";
      }
    }
  }

  return {
    status: "ready",
    page,
    filters,
    canCreate,
    canApprove: hasPermission(user, "stock_requests.approve"),
    canReject: hasPermission(user, "stock_requests.reject"),
    canCancel: hasPermission(user, "stock_requests.cancel"),
    formOptions,
    formOptionsIssue,
  };
}

export async function loadStockRequestDetailView(
  user: User,
  id: string,
): Promise<StockRequestDetailViewResult> {
  if (!hasPermission(user, "stock_requests.read"))
    return { status: "forbidden" };

  try {
    const stockRequest = await getStockRequestDetail(id);
    if (!hasBranchScope(user, stockRequest.branch_id))
      return { status: "forbidden" };

    const pending = stockRequest.status === "PENDING";
    return {
      status: "ready",
      request: stockRequest,
      canApprove: pending && hasPermission(user, "stock_requests.approve"),
      canReject: pending && hasPermission(user, "stock_requests.reject"),
      canCancel:
        pending &&
        stockRequest.requested_by_user_id === user.id &&
        hasPermission(user, "stock_requests.cancel"),
    };
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    if (error instanceof ApiRequestError && error.status === 404)
      return { status: "not-found" };
    return { status: "detail-error" };
  }
}
