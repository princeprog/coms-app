import type {
  Notification,
  NotificationFilters,
  NotificationKind,
} from "./schemas/notification.schema";
export const notificationTitle: Record<NotificationKind, string> = {
  DISPATCH_OVERDUE: "Overdue deliveries",
  DISPATCH_LATE_COUNT: "Late delivery count needs review",
  DISPATCH_SENT: "Delivery on the way",
  DISPATCH_DISCREPANCY: "Dispatch needs review",
  DISPATCH_RESOLVED: "Dispatch discrepancy resolved",
  REPORT_SUBMITTED: "Daily report ready for review",
  REPORT_RETURNED: "Daily report returned",
  REPORT_APPROVED: "Daily report approved",
};
export function notificationHref(
  item: Pick<Notification, "id" | "dispatch_id" | "report_id" | "branch_id">,
) {
  const params = new URLSearchParams();
  if (!item.dispatch_id && !item.report_id) {
    params.set("branch_id", item.branch_id);
    params.set("receiving_status", "OVERDUE");
    params.set("notification_id", item.id);
    return `/dispatches?${params}`;
  }
  if (!item.dispatch_id) {
    params.set("branch_id", item.branch_id);
    params.set("report_id", item.report_id!);
  }
  params.set("notification_id", item.id);
  return `${item.dispatch_id ? `/dispatches/${item.dispatch_id}` : "/reports"}?${params}`;
}
export function parseNotificationFilters(
  params: Pick<URLSearchParams, "get">,
): NotificationFilters {
  const page = Number(params.get("page") || 1);
  const size = Number(params.get("page_size") || 10);
  const type = params.get("type");
  return {
    status: params.get("status") === "unread" ? "unread" : "all",
    type: type === "dispatches" || type === "reports" ? type : "all",
    page: Number.isInteger(page) && page > 0 && page <= 1000000 ? page : 1,
    page_size: size === 30 || size === 50 ? size : 10,
  };
}
export function notificationInboxHref(filters: NotificationFilters) {
  return `/notifications?${new URLSearchParams({
    status: filters.status,
    type: filters.type,
    page: String(filters.page),
    page_size: String(filters.page_size),
  })}`;
}
const exactDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
const businessDate = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});
export const notificationTimestamp = (value: string) =>
  `${exactDate.format(new Date(value))} PHT`;
export const notificationContext = (item: Notification) =>
  item.kind === "DISPATCH_OVERDUE"
    ? `${item.overdue_count ?? "Pending"} overdue deliveries`
    : item.business_date
      ? `Daily report · ${businessDate.format(new Date(`${item.business_date}T00:00:00+08:00`))}`
      : "Dispatch";
