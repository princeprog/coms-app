import { describe, expect, it } from "vitest";
import type { AuditEvent } from "../schemas/audit.schema";
import {
  changeSummary,
  describeAction,
  formatAuditValue,
  formatFieldValue,
  metadataEntries,
} from "./audit-format";

const event = (patch: Partial<AuditEvent>): AuditEvent => ({
  id: "00000000-0000-4000-8000-000000000001",
  occurred_at: "2026-10-21T13:23:00.000Z",
  actor_user_id: null,
  actor_name: null,
  action: "product.updated",
  entity_type: "product",
  entity_id: null,
  entity_label: "Tapsilog",
  branch_id: null,
  changes: {},
  metadata: {},
  ...patch,
});

describe("audit format", () => {
  it("describes row changes in plain language", () => {
    expect(
      describeAction(
        event({ action: "stock_item.created", entity_type: "stock_item" }),
      ),
    ).toBe("Created stock item");
    expect(
      describeAction(
        event({ changes: { is_active: { from: true, to: false } } }),
      ),
    ).toBe("Deactivated product");
    expect(
      describeAction(
        event({
          changes: {
            price: { from: "150", to: "169" },
            is_active: { from: false, to: true },
          },
        }),
      ),
    ).toBe("Updated product");
    expect(describeAction(event({ action: "auth.sign_in_failed" }))).toBe(
      "Failed sign-in",
    );
  });

  it("summarizes changed fields with readable names", () => {
    expect(
      changeSummary(
        event({
          changes: {
            price: { from: "150", to: "169" },
            category_id: { from: "Rice meals", to: "Silog meals" },
          },
        }),
      ),
    ).toBe("Price, Category");
  });

  it("formats values and permission lists", () => {
    expect(formatAuditValue(["DINE_IN", "TAKEAWAY"])).toBe("Dine in, Takeaway");
    expect(formatAuditValue(null)).toBe("—");
    expect(formatAuditValue(false)).toBe("No");
    expect(formatFieldValue("average_unit_cost", "95.0000")).toBe("₱95.00");
    expect(formatFieldValue("average_unit_cost", "0.0125")).toBe("₱0.0125");
    expect(formatFieldValue("price", "1250.5")).toBe("₱1,250.50");
    expect(
      metadataEntries(
        event({
          action: "role.permissions_updated",
          metadata: { granted: ["costs.manage"], revoked: [] },
        }),
      ),
    ).toEqual([{ key: "granted", label: "Granted", items: ["Costs: manage"] }]);
    expect(
      metadataEntries(
        event({
          action: "export.downloaded",
          metadata: { rows: 12, filters: { date_from: "2026-10-01" } },
        }),
      ),
    ).toEqual([
      { key: "rows", label: "Rows", items: ["12"] },
      { key: "filters", label: "Filters", items: ["Date from: 2026-10-01"] },
    ]);
  });
});
