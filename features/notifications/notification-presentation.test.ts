import { describe, expect, it } from "vitest";
import {
  notificationHref,
  notificationTitle,
  parseNotificationFilters,
} from "./notification-presentation";

describe("notification presentation", () => {
  it("opens the exact branch report with a read-on-arrival identifier", () => {
    const href = notificationHref({
      id: "notification",
      dispatch_id: null,
      report_id: "report",
      branch_id: "branch",
    });
    expect(href).toBe(
      "/reports?branch_id=branch&report_id=report&notification_id=notification",
    );
  });
  it("opens dispatch details without bypassing navigation guards", () => {
    expect(
      notificationHref({
        id: "notification",
        dispatch_id: "dispatch",
        report_id: null,
        branch_id: "branch",
      }),
    ).toBe("/dispatches/dispatch?notification_id=notification");
  });
  it("uses short event titles and safe URL filter defaults", () => {
    expect(notificationTitle.DISPATCH_DISCREPANCY).toBe(
      "Dispatch needs review",
    );
    expect(
      parseNotificationFilters(
        new URLSearchParams("status=invalid&type=invalid&page=-1&page_size=20"),
      ),
    ).toEqual({ status: "all", type: "all", page: 1, page_size: 10 });
    expect(
      parseNotificationFilters(
        new URLSearchParams("status=unread&type=reports&page=2&page_size=30"),
      ),
    ).toEqual({ status: "unread", type: "reports", page: 2, page_size: 30 });
  });
});
