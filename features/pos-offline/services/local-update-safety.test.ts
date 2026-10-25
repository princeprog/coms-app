import { describe, expect, it } from "vitest";
import { registerFixture } from "../hooks/offline-ui-fixture";
import { offlineDataAllowsUpdate } from "./local-update-safety";

describe("app update safety for saved register data", () => {
  it("allows updates when the device has no prepared register", () => {
    expect(offlineDataAllowsUpdate([])).toBe(true);
  });
  it("blocks updates while an order is in progress", () => {
    expect(offlineDataAllowsUpdate([registerFixture()])).toBe(false);
  });
  it("blocks updates until every saved sale is confirmed, including locked registers", () => {
    const state = registerFixture();
    state.cart.items = [];
    const envelope = {
      id: "s",
      session_id: "x",
      device_id: "d",
      shift_id: "h",
      sequence: 1,
      snapshot_id: "p",
      captured_at: "2026-10-26T02:00:00.000Z",
      service_type: "DINE_IN" as const,
      items: [],
      cash_tendered: "1",
      total_amount: "1",
    };
    state.records = [{ status: "PENDING", envelope }];
    expect(offlineDataAllowsUpdate([state])).toBe(false);
    state.records = [{ status: "NEEDS_REVIEW", envelope }];
    expect(offlineDataAllowsUpdate([state])).toBe(false);
    state.records = [{ status: "ACKNOWLEDGED", envelope }];
    expect(offlineDataAllowsUpdate([state])).toBe(true);
  });
});
