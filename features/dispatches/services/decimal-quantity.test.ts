import { describe, expect, it } from "vitest";
import {
  isDecimalQuantityWithinLimit,
  isPositiveDecimalQuantity,
} from "./decimal-quantity";

describe("dispatch decimal quantities", () => {
  it("compares quantities exactly beyond JavaScript's safe integer range", () => {
    expect(
      isDecimalQuantityWithinLimit("9007199254740993.1", "9007199254740993.2"),
    ).toBe(true);
    expect(
      isDecimalQuantityWithinLimit("9007199254740993.3", "9007199254740993.2"),
    ).toBe(false);
  });

  it("accepts equal quantities with different leading zeros and decimal scales", () => {
    expect(isDecimalQuantityWithinLimit("0004.5000", "4.5")).toBe(true);
    expect(isDecimalQuantityWithinLimit("4.5001", "4.5")).toBe(false);
  });

  it("rejects malformed decimal strings", () => {
    expect(isDecimalQuantityWithinLimit("1e3", "1000")).toBe(false);
    expect(isDecimalQuantityWithinLimit("1.5", "invalid")).toBe(false);
  });

  it("distinguishes positive values from decimal zero", () => {
    expect(isPositiveDecimalQuantity("0.0000")).toBe(false);
    expect(isPositiveDecimalQuantity("0.0001")).toBe(true);
    expect(isPositiveDecimalQuantity("invalid")).toBe(false);
  });
});
