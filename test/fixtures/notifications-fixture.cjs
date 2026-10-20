// Synthetic inbox data for UI tests; recipient authorization is covered by API e2e tests.
function createNotificationSeed(state, count) {
  const kinds = [
    "DISPATCH_DISCREPANCY",
    "REPORT_SUBMITTED",
    "DISPATCH_SENT",
    "REPORT_RETURNED",
    "DISPATCH_RESOLVED",
    "REPORT_APPROVED",
  ];
  return Array.from({ length: count }, (_, index) => {
    const kind = kinds[index % kinds.length];
    const report = kind.startsWith("REPORT_")
      ? state.dailyReports[index % state.dailyReports.length]
      : null;
    const dispatch = report
      ? null
      : state.dispatches[index % state.dispatches.length];
    const branchId = report?.branch_id ?? dispatch.branch_id;
    return {
      id: `99000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      kind,
      branch_id: branchId,
      branch_name: state.branches.find((branch) => branch.id === branchId)
        .branch_name,
      report_id: report?.id ?? null,
      dispatch_id: dispatch?.id ?? null,
      business_date: report?.business_date ?? null,
      created_at: new Date(
        Date.UTC(2026, 9, 20, 8, 0) - index * 60000,
      ).toISOString(),
      read_at: null,
    };
  });
}
function handleNotifications({ request, response, url, items, send }) {
  if (
    url.pathname === "/notifications/unread-count" &&
    request.method === "GET"
  ) {
    send(response, 200, {
      unread_count: items.filter((item) => !item.read_at).length,
    });
    return true;
  }
  if (url.pathname === "/notifications" && request.method === "GET") {
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("page_size") || 10);
    const type = url.searchParams.get("type");
    const filtered = items.filter(
      (item) =>
        (url.searchParams.get("status") !== "unread" || !item.read_at) &&
        (type !== "reports" || item.report_id) &&
        (type !== "dispatches" || item.dispatch_id),
    );
    send(response, 200, {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
    });
    return true;
  }
  if (
    request.method === "PATCH" &&
    url.pathname === "/notifications/read-all"
  ) {
    items.forEach((item) => {
      item.read_at ??= new Date().toISOString();
    });
    send(response, 200, { updated: true });
    return true;
  }
  const match = url.pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (request.method === "PATCH" && match) {
    const item = items.find((item) => item.id === match[1]);
    if (!item) send(response, 404, { message: "Notification not found" });
    else {
      item.read_at ??= new Date().toISOString();
      send(response, 200, { id: item.id, read_at: item.read_at });
    }
    return true;
  }
  return false;
}
module.exports = { createNotificationSeed, handleNotifications };
