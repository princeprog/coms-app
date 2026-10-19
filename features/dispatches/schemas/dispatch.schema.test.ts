import { describe, expect, it } from "vitest";
import {
  closeDispatchShortageSchema,
  dispatchDetailSchema,
  dispatchPageSchema,
  createDispatchSchema,
  receiveDispatchSchema,
  sendDispatchSchema,
} from "./dispatch.schema";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("dispatch schemas", () => {
  it("validates a direct branch dispatch and its unique item lines", () => {
    expect(
      createDispatchSchema.safeParse({
        branch_id: id,
        items: [{ stock_item_id: id, quantity_dispatched: "25.5" }],
      }).success,
    ).toBe(true);
    expect(
      createDispatchSchema.safeParse({
        branch_id: "bad-id",
        items: [{ stock_item_id: id, quantity_dispatched: "1" }],
      }).success,
    ).toBe(false);
    expect(
      createDispatchSchema.safeParse({
        branch_id: id,
        items: [
          { stock_item_id: id, quantity_dispatched: "1" },
          { stock_item_id: id, quantity_dispatched: "2" },
        ],
      }).success,
    ).toBe(false);
    expect(
      createDispatchSchema.safeParse({
        branch_id: id,
        items: [{ stock_item_id: id, quantity_dispatched: "0" }],
      }).success,
    ).toBe(false);
  });

  it("requires who is delivering a sent dispatch", () => {
    const draft = {
      branch_id: id,
      items: [{ stock_item_id: id, quantity_dispatched: "1" }],
    };
    expect(
      sendDispatchSchema.safeParse({ ...draft, delivered_by_name: " Juan " })
        .data?.delivered_by_name,
    ).toBe("Juan");
    expect(
      sendDispatchSchema.safeParse({ ...draft, delivered_by_name: "  " })
        .success,
    ).toBe(false);
    expect(sendDispatchSchema.safeParse(draft).success).toBe(false);
  });

  it("accepts zero and decimal counts with an optional note", () => {
    expect(
      receiveDispatchSchema.safeParse({
        items: [{ dispatch_item_id: id, quantity_received: "0" }],
        note: "Box missing",
      }).success,
    ).toBe(true);
  });

  it("rejects negative, malformed, or duplicate count lines", () => {
    expect(
      receiveDispatchSchema.safeParse({
        items: [{ dispatch_item_id: id, quantity_received: "-1" }],
      }).success,
    ).toBe(false);
    expect(
      receiveDispatchSchema.safeParse({
        items: [
          { dispatch_item_id: id, quantity_received: "1" },
          { dispatch_item_id: id, quantity_received: "2" },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires an outcome, a trimmed reason, and positive unique resolution lines", () => {
    expect(
      closeDispatchShortageSchema.safeParse({
        outcome: "LOST",
        reason: "   ",
        items: [{ dispatch_item_id: id, quantity_closed: "1" }],
      }).success,
    ).toBe(false);
    expect(
      closeDispatchShortageSchema.safeParse({
        reason: "Missing outcome",
        items: [{ dispatch_item_id: id, quantity_closed: "1" }],
      }).success,
    ).toBe(false);
    expect(
      closeDispatchShortageSchema.safeParse({
        outcome: "NOT_LOADED",
        reason: "Damaged during transit",
        items: [
          { dispatch_item_id: id, quantity_closed: "1.25" },
          { dispatch_item_id: id, quantity_closed: "0.5" },
        ],
      }).success,
    ).toBe(false);
  });

  it("validates dispatch detail quantities, statuses, receipts, and events", () => {
    const detail = {
      id,
      branch_id: id,
      branch_name: "Downtown",
      status: "PARTIALLY_RECEIVED",
      created_by_user_id: id,
      created_by_name: "Commissary Staff",
      dispatched_by_user_id: id,
      dispatched_by_name: "Commissary Staff",
      dispatched_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      items: [
        {
          id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_dispatched: "5",
          quantity_received: "2.5",
          quantity_shortage_closed: "0",
          quantity_in_transit: "2.5",
        },
      ],
      receipts: [
        {
          id,
          received_by_user_id: id,
          receiver_name: "Branch Manager",
          created_at: timestamp,
          items: [
            {
              receipt_item_id: id,
              dispatch_item_id: id,
              stock_item_id: id,
              stock_item_name: "Flour",
              unit: "kg",
              quantity_received: "2.5",
            },
          ],
        },
      ],
      shortage_closures: [],
      events: [
        {
          id,
          event_type: "DISPATCHED",
          actor_user_id: id,
          actor_name: "Commissary Staff",
          dispatch_receipt_id: null,
          shortage_closure_id: null,
          created_at: timestamp,
        },
      ],
    };

    expect(dispatchDetailSchema.safeParse(detail).success).toBe(true);
    expect(
      dispatchDetailSchema.safeParse({ ...detail, status: "UNKNOWN" }).success,
    ).toBe(false);
    expect(
      dispatchDetailSchema.safeParse({
        ...detail,
        items: [{ ...detail.items[0], quantity_in_transit: "-2" }],
      }).success,
    ).toBe(false);
    expect(
      dispatchDetailSchema.safeParse({
        ...detail,
        counted_at: timestamp,
        items: [
          {
            ...detail.items[0],
            quantity_in_transit: "0",
            quantity_outstanding: "-1.5",
            quantity_variance: "-1.5",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      dispatchDetailSchema.safeParse({
        ...detail,
        items: [
          {
            ...detail.items[0],
            quantity_dispatched: null,
            quantity_in_transit: null,
            awaiting_count: true,
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      dispatchPageSchema.safeParse({
        items: [],
        total: 0,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
  });
});
