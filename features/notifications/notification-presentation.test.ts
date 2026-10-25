import { describe, expect, it } from "vitest";
import {
  notificationContext,
  notificationHref,
  notificationTitle,
  parseNotificationFilters,
} from "./notification-presentation";

describe("notification presentation", () => {
  it("sends register requests to the branch approval page and decisions to Point of Sale", () => {
    const base = {
      id: "n1",
      dispatch_id: null,
      report_id: null,
      branch_id: "branch",
    };
    expect(
      notificationHref({ ...base, kind: "REGISTER_DEVICE_REQUESTED" }),
    ).toBe("/branches/branch/offline-pos?notification_id=n1");
    expect(
      notificationHref({ ...base, kind: "REGISTER_DEVICE_APPROVED" }),
    ).toBe("/pos?branch=branch&notification_id=n1");
    expect(notificationTitle.REGISTER_DEVICE_REQUESTED).toBe(
      "Register approval requested",
    );
    expect(notificationTitle.REGISTER_DEVICE_APPROVED).toBe(
      "Register approved",
    );
    expect(notificationTitle.REGISTER_DEVICE_REVOKED).toBe(
      "Register approval revoked",
    );
    expect(
      notificationContext({
        ...base,
        kind: "REGISTER_DEVICE_REQUESTED",
        branch_name: "Banilad",
        register_device_name: "Front counter",
        business_date: null,
        created_at: "2026-10-26T01:00:00Z",
        read_at: null,
      }),
    ).toBe("Front counter");
    expect(
      parseNotificationFilters(new URLSearchParams("type=registers")).type,
    ).toBe("registers");
  });
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
