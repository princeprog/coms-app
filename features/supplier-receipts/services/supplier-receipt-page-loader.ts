import "server-only";

import { hasPermission } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types/auth.types";
import { ApiRequestError } from "@/services/api-services";
import type {
  SupplierReceiptFormOptions,
  SupplierReceipt,
  SupplierReceiptPage,
} from "@/features/supplier-receipts/types/supplier-receipt.types";
import {
  createSupplierReceiptHref,
  parseSupplierReceiptPageFilters,
  type SupplierReceiptPageSearchParams,
} from "./supplier-receipt-page-params";
import {
  getSupplierReceiptDetail,
  getSupplierReceiptFormOptions,
  getSupplierReceiptPageData,
} from "./supplier-receipt-queries";

export type SupplierReceiptIndexViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "list-error" }
  | { status: "redirect"; href: string }
  | {
      status: "ready";
      page: SupplierReceiptPage;
      search: string;
      statusFilter: "all" | "DRAFT" | "POSTED";
      canCreate: boolean;
      formOptions: SupplierReceiptFormOptions | null;
      formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null;
    };

export type SupplierReceiptDetailViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "not-found" }
  | { status: "detail-error" }
  | { status: "ready"; receipt: SupplierReceipt; canPost: boolean };

function getAccessFailure(
  error: unknown,
): { status: "forbidden" } | { status: "session-expired" } | null {
  if (!(error instanceof ApiRequestError)) return null;
  if (error.status === 401) return { status: "session-expired" };
  if (error.status === 403) return { status: "forbidden" };
  return null;
}

export async function loadSupplierReceiptIndexView(
  user: User,
  searchParams: SupplierReceiptPageSearchParams,
): Promise<SupplierReceiptIndexViewResult> {
  if (!hasPermission(user, "supplier_receipts.read")) {
    return { status: "forbidden" };
  }

  const filters = parseSupplierReceiptPageFilters(searchParams);
  let page: SupplierReceiptPage;
  try {
    page = await getSupplierReceiptPageData({
      page: filters.page,
      search: filters.search,
      status: filters.status === "all" ? undefined : filters.status,
    });
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    return { status: "list-error" };
  }

  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  if (filters.page > pageCount) {
    return {
      status: "redirect",
      href: createSupplierReceiptHref({ ...filters, page: pageCount }),
    };
  }

  const canCreate = hasPermission(user, "supplier_receipts.create");
  let formOptions: SupplierReceiptFormOptions | null = null;
  let formOptionsIssue: "permissions" | "forbidden" | "unavailable" | null =
    null;

  if (canCreate) {
    const canReadSuppliers = hasPermission(user, "suppliers.read");
    const canReadStockItems = hasPermission(user, "stock_items.read");
    if (!canReadSuppliers || !canReadStockItems) {
      formOptionsIssue = "permissions";
    } else {
      try {
        formOptions = await getSupplierReceiptFormOptions();
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
    search: filters.search,
    statusFilter: filters.status,
    canCreate,
    formOptions,
    formOptionsIssue,
  };
}

export async function loadSupplierReceiptDetailView(
  user: User,
  id: string,
): Promise<SupplierReceiptDetailViewResult> {
  if (!hasPermission(user, "supplier_receipts.read")) {
    return { status: "forbidden" };
  }

  try {
    const receipt = await getSupplierReceiptDetail(id);
    return {
      status: "ready",
      receipt,
      canPost: hasPermission(user, "supplier_receipts.post"),
    };
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    if (error instanceof ApiRequestError && error.status === 404) {
      return { status: "not-found" };
    }
    return { status: "detail-error" };
  }
}
