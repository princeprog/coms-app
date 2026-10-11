import { describe, expect, it } from "vitest";
import { calculateCashChange } from "./pos-cash";

describe("cash received and change", () => {
  it("subtracts exactly with mixed scales and large values", () => {
    expect(calculateCashChange("1000", "540").change).toBe("460");
    expect(calculateCashChange("10", "7.625").change).toBe("2.375");
    expect(
      calculateCashChange("9007199254740993.01", "9007199254740993").change,
    ).toBe("0.01");
    expect(calculateCashChange("540.00", "540").change).toBe("0");
  });
  it("reports shortfall instead of a negative change", () => {
    expect(calculateCashChange("500", "540")).toEqual({
      change: null,
      shortfall: "40",
    });
  });
  it("never treats blank, malformed or unvalidated totals as paid", () => {
    for (const amount of [
      "",
      "-1",
      "1e3",
      "1,000",
      "NaN",
      "1000.",
      "9".repeat(61),
    ]) {
      expect(calculateCashChange(amount, "540").change).toBeNull();
    }
    expect(calculateCashChange("1000", null).change).toBeNull();
  });
});
