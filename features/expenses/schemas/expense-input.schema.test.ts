import { describe, expect, it } from "vitest";
import {
  categoryInputSchema,
  correctionSchema,
  expenseInputSchema,
} from "./expense-input.schema";
import { expenseSchema } from "./expense.schema";
import { ids, input, expense } from "../test-fixtures";
describe("expense input contract", () => {
  it.each(["0", "0.00", "-1", "1.001", "1e2", "1000000000.00", "NaN"])(
    "rejects invalid money %s",
    (amount) => {
      expect(expenseInputSchema.safeParse({ ...input, amount }).success).toBe(
        false,
      );
    },
  );
  it.each(["0.01", "1.1", "999999999.99"])(
    "preserves exact decimal %s",
    (amount) => {
      expect(expenseInputSchema.parse({ ...input, amount }).amount).toBe(
        amount,
      );
    },
  );
  it("requires consistent scope, payment and cash links", () => {
    for (const change of [
      { scope: "COMMISSARY" },
      { branch_id: null },
      { cash_source: "REGISTER" },
      { payment_method: "CARD" },
      { cash_movement_id: ids.cash },
    ])
      expect(
        expenseInputSchema.safeParse({ ...input, ...change }).success,
      ).toBe(false);
    expect(
      expenseInputSchema.safeParse({
        ...input,
        cash_source: "REGISTER",
        cash_movement_id: ids.cash,
      }).success,
    ).toBe(true);
    expect(
      expenseInputSchema.safeParse({
        ...input,
        scope: "COMMISSARY",
        branch_id: null,
        cash_source: "REGISTER",
        cash_movement_id: ids.cash,
      }).success,
    ).toBe(false);
  });
  it("validates dates, text limits and correction reasons", () => {
    for (const change of [
      { expense_date: "2099-01-01" },
      { expense_date: "2026-02-30" },
      { description: " " },
      { reference: "x".repeat(101) },
      { notes: "x".repeat(1001) },
    ])
      expect(
        expenseInputSchema.safeParse({ ...input, ...change }).success,
      ).toBe(false);
    expect(
      correctionSchema.safeParse({ revision: 1, reason: " " }).success,
    ).toBe(false);
    expect(
      correctionSchema.safeParse({ revision: 0, reason: "Correction" }).success,
    ).toBe(false);
  });
  it("reserves the virtual purchase category and permits nullable imported payment metadata", () => {
    expect(
      categoryInputSchema.safeParse({ name: "  STOCK PURCHASES " }).success,
    ).toBe(false);
    expect(
      expenseSchema.parse({
        ...expense,
        source: "DIRECT_PURCHASE",
        category_id: "STOCK_PURCHASES",
        payment_method: null,
        cash_source: null,
      }).payment_method,
    ).toBeNull();
  });
});
