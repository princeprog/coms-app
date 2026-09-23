import { describe, expect, it } from "vitest";
import {
  closeDispatchShortageSchema,
  dispatchDetailSchema,
  dispatchPageSchema,
  createDispatchSchema,
  receiveDispatchSchema,
} from "./dispatch.schema";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("dispatch schemas", () => {
  it("accepts only a UUID stock request when creating a draft", () => {
    expect(
      createDispatchSchema.safeParse({ stock_request_id: id }).success,
    ).toBe(true);
    expect(
      createDispatchSchema.safeParse({ stock_request_id: "bad-id" }).success,
    ).toBe(false);
  });

  it("accepts positive decimal quantities for partial receipt lines", () => {
    expect(
      receiveDispatchSchema.safeParse({
        items: [{ dispatch_item_id: id, quantity_received: "2.5000" }],
      }).success,
    ).toBe(true);
  });

  it("rejects zero, malformed, or duplicate receipt lines", () => {
    expect(
      receiveDispatchSchema.safeParse({
        items: [{ dispatch_item_id: id, quantity_received: "0.000" }],
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

  it("requires a trimmed reason and positive unique shortage lines", () => {
    expect(
      closeDispatchShortageSchema.safeParse({
        reason: "   ",
        items: [{ dispatch_item_id: id, quantity_closed: "1" }],
      }).success,
    ).toBe(false);
    expect(
      closeDispatchShortageSchema.safeParse({
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
      stock_request_id: id,
      branch_id: id,
      branch_name: "Downtown",
      stock_request_status: "APPROVED",
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
          stock_request_item_id: id,
          stock_item_id: id,
          stock_item_name: "Flour",
          unit: "kg",
          quantity_requested: "5",
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
      dispatchPageSchema.safeParse({
        items: [],
        total: 0,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
  });
});
