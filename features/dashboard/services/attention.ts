import type { AttentionKey } from "../schemas/dashboard-today.schema";

export type AttentionTone = "critical" | "warning" | "info";

type AttentionConfig = {
  label: (count: number) => string;
  tone: AttentionTone;
  /** Page that resolves the item, before the branch filter is added. */
  path: string;
  /** Query parameter that carries the branch on that page. */
  branchParam?: "branch_id" | "branch";
};

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

export const attentionConfig: Record<AttentionKey, AttentionConfig> = {
  deliveries_overdue: {
    label: (n) =>
      plural(
        n,
        "Delivery overdue for counting",
        "Deliveries overdue for counting",
      ),
    tone: "critical",
    path: "/dispatches?receiving_status=OVERDUE",
    branchParam: "branch_id",
  },
  open_discrepancies: {
    label: (n) =>
      plural(n, "Delivery discrepancy open", "Delivery discrepancies open"),
    tone: "critical",
    path: "/dispatches?discrepancy_status=OPEN",
    branchParam: "branch_id",
  },
  shifts_open_past_day: {
    label: (n) =>
      plural(
        n,
        "Shift left open from an earlier day",
        "Shifts left open from an earlier day",
      ),
    tone: "critical",
    path: "/shifts?status=OPEN",
    branchParam: "branch",
  },
  cash_shortages: {
    label: (n) =>
      plural(n, "Cash shortage this week", "Cash shortages this week"),
    tone: "critical",
    path: "/shifts",
    branchParam: "branch",
  },
  stock_below_zero: {
    label: (n) => plural(n, "Stock item below zero", "Stock items below zero"),
    tone: "critical",
    path: "/inventory?scope=BRANCH",
    branchParam: "branch_id",
  },
  branch_stock_low: {
    label: (n) =>
      plural(n, "Branch item needs restocking", "Branch items need restocking"),
    tone: "warning",
    path: "/inventory?scope=BRANCH&stock=low",
    branchParam: "branch_id",
  },
  commissary_stock_low: {
    label: (n) =>
      plural(
        n,
        "Commissary item needs restocking",
        "Commissary items need restocking",
      ),
    tone: "warning",
    path: "/inventory?scope=COMMISSARY&stock=low",
  },
  reports_missing: {
    label: (n) =>
      plural(
        n,
        "Yesterday's daily report not started",
        "Yesterday's daily reports not started",
      ),
    tone: "warning",
    path: "/reports",
    branchParam: "branch_id",
  },
  reports_returned: {
    label: (n) =>
      plural(
        n,
        "Daily report returned for correction",
        "Daily reports returned for correction",
      ),
    tone: "warning",
    path: "/reports?status=RETURNED",
    branchParam: "branch_id",
  },
  reports_to_review: {
    label: (n) =>
      plural(n, "Daily report to review", "Daily reports to review"),
    tone: "warning",
    path: "/reports?status=SUBMITTED",
    branchParam: "branch_id",
  },
  late_counts_to_review: {
    label: (n) =>
      plural(
        n,
        "Late delivery count to review",
        "Late delivery counts to review",
      ),
    tone: "warning",
    path: "/dispatches?receiving_status=REVIEW",
    branchParam: "branch_id",
  },
  shifts_to_review: {
    label: (n) =>
      plural(n, "Closed shift to review", "Closed shifts to review"),
    tone: "warning",
    path: "/shifts?status=CLOSED",
    branchParam: "branch",
  },
  dispatches_draft: {
    label: (n) =>
      plural(
        n,
        "Dispatch drafted but not sent",
        "Dispatches drafted but not sent",
      ),
    tone: "warning",
    path: "/dispatches?status=DRAFT",
    branchParam: "branch_id",
  },
  deliveries_in_transit: {
    label: (n) => plural(n, "Delivery on the way", "Deliveries on the way"),
    tone: "info",
    path: "/dispatches?receiving_status=AWAITING_COUNT",
    branchParam: "branch_id",
  },
  products_incomplete_costs: {
    label: (n) =>
      plural(
        n,
        "Product missing a recipe or cost",
        "Products missing a recipe or cost",
      ),
    tone: "warning",
    path: "/costs?view=products&status=incomplete",
  },
};

const toneOrder: Record<AttentionTone, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function attentionHref(key: AttentionKey, branchId?: string) {
  const { path, branchParam } = attentionConfig[key];
  if (!branchId || !branchParam) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${branchParam}=${branchId}`;
}

/** Items with something to do, most urgent first. */
export function pendingAttention(
  items: { key: AttentionKey; count: number }[],
) {
  return items
    .filter((item) => item.count > 0)
    .map((item, index) => ({ ...item, index, ...attentionConfig[item.key] }))
    .sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone] || a.index - b.index);
}
