import { describe, expect, it } from "vitest";
import {
  createStockRequestSchema,
  stockRequestDetailSchema,
  stockRequestPageSchema,
} from "./stock-request.schema";

const id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const secondId = "d34b9dc6-135f-4bd0-9f25-43a9617c9e0a";
const timestamp = "2026-09-24T01:30:00.000Z";
const requestDetail = {
  id,
  branch_id: id,
  branch_name: "Downtown",
  requested_by_user_id: secondId,
  requester_name: "Branch Manager",
  status: "PENDING",
  created_at: timestamp,
  updated_at: timestamp,
  items: [
    {
      id: secondId,
      stock_item_id: id,
      stock_item_name: "Flour",
      unit: "kg",
      quantity_requested: "12.5",
      created_at: timestamp,
    },
  ],
  events: [
    {
      id: secondId,
      event_type: "SUBMITTED",
      actor_user_id: secondId,
      actor_name: "Branch Manager",
      created_at: timestamp,
    },
  ],
};

describe("stock request schemas", () => {
  it("accepts positive decimal quantities and rejects zero or exponent notation", () => {
    expect(
      createStockRequestSchema.safeParse({
        branch_id: id,
        items: [{ stock_item_id: secondId, quantity_requested: "12.5000" }],
      }).success,
    ).toBe(true);
    expect(
      createStockRequestSchema.safeParse({
        branch_id: id,
        items: [{ stock_item_id: secondId, quantity_requested: "0.000" }],
      }).success,
    ).toBe(false);
    expect(
      createStockRequestSchema.safeParse({
        branch_id: id,
        items: [{ stock_item_id: secondId, quantity_requested: "1e3" }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate stock items and unexpected create fields", () => {
    const line = { stock_item_id: secondId, quantity_requested: "1" };
    expect(
      createStockRequestSchema.safeParse({
        branch_id: id,
        items: [line, line],
      }).success,
    ).toBe(false);
    expect(
      createStockRequestSchema.safeParse({
        branch_id: id,
        items: [line],
        status: "APPROVED",
      }).success,
    ).toBe(false);
  });

  it("validates paginated request and detail responses", () => {
    const page = {
      items: [
        {
          id,
          branch_id: id,
          branch_name: "Downtown",
          requested_by_user_id: secondId,
          requester_name: "Branch Manager",
          status: "PENDING",
          created_at: timestamp,
          updated_at: timestamp,
          item_count: 1,
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };
    expect(stockRequestPageSchema.safeParse(page).success).toBe(true);
    expect(stockRequestDetailSchema.safeParse(requestDetail).success).toBe(
      true,
    );
    expect(
      stockRequestDetailSchema.safeParse({
        ...requestDetail,
        items: [{ ...requestDetail.items[0], quantity_requested: "NaN" }],
      }).success,
    ).toBe(false);
  });
});
