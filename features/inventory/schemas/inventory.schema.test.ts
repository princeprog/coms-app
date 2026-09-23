import { describe, expect, it } from "vitest";
import {
  createInventoryAdjustmentSchema,
  inventoryMovementPageSchema,
  inventoryPageSchema,
} from "./inventory.schema";

const itemId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const timestamp = "2026-09-24T01:30:00.000Z";

describe("inventory schemas", () => {
  it("accepts exact decimal balances and paginated inventory", () => {
    expect(
      inventoryPageSchema.safeParse({
        items: [
          {
            id: itemId,
            stock_item_name: "Flour",
            category: "Dry goods",
            unit: "kg",
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
            quantity_on_hand: "2.5000",
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
  });

  it("rejects numeric values that could lose database decimal precision", () => {
    expect(
      inventoryPageSchema.safeParse({
        items: [
          {
            id: itemId,
            stock_item_name: "Flour",
            category: "Dry goods",
            unit: "kg",
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp,
            quantity_on_hand: 2.5,
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
  });

  it("validates movement scope and decimal-string deltas", () => {
    const movement = {
      id: itemId,
      inventory_scope: "BRANCH",
      branch_id: itemId,
      stock_item_id: itemId,
      stock_item_name: "Flour",
      unit: "kg",
      movement_type: "ADJUSTMENT",
      quantity_delta: "-0.25",
      reason: "Count correction",
      actor_user_id: itemId,
      idempotency_key: itemId,
      created_at: timestamp,
    };

    expect(
      inventoryMovementPageSchema.safeParse({
        items: [movement],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(true);
    expect(
      inventoryMovementPageSchema.safeParse({
        items: [{ ...movement, inventory_scope: "GLOBAL" }],
        total: 1,
        page: 1,
        page_size: 25,
      }).success,
    ).toBe(false);
  });

  it("accepts signed nonzero adjustments and rejects zero or blank reasons", () => {
    expect(
      createInventoryAdjustmentSchema.safeParse({
        stock_item_id: itemId,
        quantity_delta: "-1.250",
        reason: "Physical count correction",
      }).success,
    ).toBe(true);
    for (const quantity_delta of ["0", "-0.000", "1e2", 2]) {
      expect(
        createInventoryAdjustmentSchema.safeParse({
          stock_item_id: itemId,
          quantity_delta,
          reason: "Reason",
        }).success,
      ).toBe(false);
    }
    expect(
      createInventoryAdjustmentSchema.safeParse({
        stock_item_id: itemId,
        quantity_delta: "1",
        reason: "   ",
      }).success,
    ).toBe(false);
  });
});
