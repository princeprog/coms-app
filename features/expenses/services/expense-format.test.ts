import { describe, expect, it } from "vitest";
import { cents, pesos } from "./expense-format";
import { decimalSchema } from "../schemas/expense.schema";
import { expenseInputSchema } from "../schemas/expense-input.schema";
import { input } from "../test-fixtures";

describe("exact expense response money", () => {
  it.each([
    ["24.7000", "2470", "₱24.70"],
    ["12.3456", "1235", "₱12.35"],
    ["0.004", "0", "₱0.00"],
    ["999999999999.995", "100000000000000", "₱1,000,000,000,000.00"],
  ])(
    "rounds %s half-up without floating point",
    (value, minorUnits, formatted) => {
      expect(decimalSchema.parse(value)).toBe(value);
      expect(cents(value)).toBe(BigInt(minorUnits));
      expect(pesos(value)).toBe(formatted);
    },
  );
  it("keeps the two-decimal limit on user-entered amounts", () => {
    expect(
      expenseInputSchema.safeParse({ ...input, amount: "12.3456" }).success,
    ).toBe(false);
    expect(
      expenseInputSchema.safeParse({ ...input, amount: "24.7000" }).success,
    ).toBe(false);
  });
});
