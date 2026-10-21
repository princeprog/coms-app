const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExportTarget = {
  /** API path; branch exports receive the validated branch ID. */
  path: (branchId: string) => string;
  needsBranch?: boolean;
  params: readonly string[];
};

const inventoryFilters = ["search", "is_active", "category"] as const;
const rangeFilters = ["from", "to"] as const;

export const exportTargets = {
  sales: {
    path: (branch) => `/branches/${branch}/sales/export`,
    needsBranch: true,
    params: ["status", "tender_method", "search", "date_from", "date_to"],
  },
  "profit-branches": {
    path: () => "/costs/branches/export",
    params: rangeFilters,
  },
  "profit-products": {
    path: () => "/costs/branch-products/export",
    params: [...rangeFilters, "branch_id"],
  },
  "product-costs": {
    path: () => "/costs/products/export",
    params: ["search", "status"],
  },
  "stock-costs": {
    path: () => "/costs/stock-items/export",
    params: ["search", "missing_only"],
  },
  "commissary-inventory": {
    path: () => "/inventory/commissary/export",
    params: inventoryFilters,
  },
  "commissary-movements": {
    path: () => "/inventory/commissary/movements/export",
    params: ["stock_item_id"],
  },
  "branch-inventory": {
    path: (branch) => `/inventory/branches/${branch}/export`,
    needsBranch: true,
    params: inventoryFilters,
  },
  "branch-movements": {
    path: (branch) => `/inventory/branches/${branch}/movements/export`,
    needsBranch: true,
    params: ["stock_item_id"],
  },
  "supplier-deliveries": {
    path: () => "/supplier-receipts/export",
    params: [
      "search",
      "supplier_id",
      "received_from",
      "received_to",
      "min_cost",
      "max_cost",
      "sort",
    ],
  },
  "direct-purchases": {
    path: () => "/direct-purchases/export",
    params: ["search", "purchased_from", "purchased_to", "sort"],
  },
  "daily-reports": {
    path: (branch) => `/branches/${branch}/daily-reports/export`,
    needsBranch: true,
    params: ["status"],
  },
  "sales-report": {
    path: () => "/reports/sales/export",
    params: ["period", "date", "branch_id"],
  },
  "sales-report-pdf": {
    path: () => "/reports/sales/pdf",
    params: ["period", "date", "branch_id"],
  },
} satisfies Record<string, ExportTarget>;

export type ExportKind = keyof typeof exportTargets;

/** Builds the API path for an allowed export, keeping only its known filters. */
export function resolveExportTarget(kind: string, query: URLSearchParams) {
  if (!Object.hasOwn(exportTargets, kind)) return null;
  const target: ExportTarget = exportTargets[kind as ExportKind];
  const branchId = query.get("branch_id") ?? "";
  if (target.needsBranch && !uuid.test(branchId)) return null;
  const forwarded = new URLSearchParams();
  for (const key of target.params) {
    const value = query.get(key)?.trim();
    if (value && value.length <= 200) forwarded.set(key, value);
  }
  const search = forwarded.toString();
  return target.path(branchId) + (search ? `?${search}` : "");
}
