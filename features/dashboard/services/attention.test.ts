import { describe, expect, it } from "vitest";
import { attentionHref, pendingAttention } from "./attention";

describe("dashboard attention", () => {
  it("hides finished items and puts urgent ones first", () => {
    const items = pendingAttention([
      { key: "deliveries_in_transit", count: 2 },
      { key: "reports_to_review", count: 1 },
      { key: "cash_shortages", count: 0 },
      { key: "deliveries_overdue", count: 3 },
    ]);
    expect(items.map((item) => item.key)).toEqual([
      "deliveries_overdue",
      "reports_to_review",
      "deliveries_in_transit",
    ]);
    expect(items[0].label(3)).toBe("Deliveries overdue for counting");
    expect(items[1].label(1)).toBe("Daily report to review");
  });

  it("links to the filtered page for the selected branch", () => {
    expect(attentionHref("deliveries_overdue", "b1")).toBe(
      "/dispatches?receiving_status=OVERDUE&branch_id=b1",
    );
    expect(attentionHref("shifts_to_review", "b1")).toBe(
      "/shifts?status=CLOSED&branch=b1",
    );
    expect(attentionHref("reports_missing", "b1")).toBe(
      "/reports?branch_id=b1",
    );
  });
});
