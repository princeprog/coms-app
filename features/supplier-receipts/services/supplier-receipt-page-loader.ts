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
  type SupplierReceiptPageFilters,
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
      filters: SupplierReceiptPageFilters;
      canCreate: boolean;
      createIssue: "permissions" | null;
    };

export type SupplierReceiptCreateViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "unavailable" }
  | { status: "ready"; formOptions: SupplierReceiptFormOptions };

export type SupplierReceiptDetailViewResult =
  | { status: "forbidden" }
  | { status: "session-expired" }
  | { status: "not-found" }
  | { status: "detail-error" }
  | { status: "ready"; receipt: SupplierReceipt };

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
    page = await getSupplierReceiptPageData(filters);
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

  const hasCreatePermission = hasPermission(user, "supplier_receipts.create");
  const hasCatalogPermissions =
    hasPermission(user, "suppliers.read") &&
    hasPermission(user, "stock_items.read");
  const canCreate = hasCreatePermission && hasCatalogPermissions;

  return {
    status: "ready",
    page,
    search: filters.search,
    filters,
    canCreate,
    createIssue:
      hasCreatePermission && !hasCatalogPermissions ? "permissions" : null,
  };
}

export async function loadSupplierReceiptCreateView(
  user: User,
): Promise<SupplierReceiptCreateViewResult> {
  if (
    !hasPermission(user, "supplier_receipts.read") ||
    !hasPermission(user, "supplier_receipts.create") ||
    !hasPermission(user, "suppliers.read") ||
    !hasPermission(user, "stock_items.read")
  ) {
    return { status: "forbidden" };
  }

  try {
    return {
      status: "ready",
      formOptions: await getSupplierReceiptFormOptions(),
    };
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    return { status: "unavailable" };
  }
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
    return { status: "ready", receipt };
  } catch (error) {
    const accessFailure = getAccessFailure(error);
    if (accessFailure) return accessFailure;
    if (error instanceof ApiRequestError && error.status === 404) {
      return { status: "not-found" };
    }
    return { status: "detail-error" };
  }
}
