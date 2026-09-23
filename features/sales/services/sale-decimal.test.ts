import { describe, expect, it } from "vitest";
import {
  addSaleDecimals,
  calculateSaleTotal,
  multiplySaleDecimals,
} from "./sale-decimal";

describe("exact POS decimal calculations", () => {
  it("calculates multi-product estimates without floating point", () => {
    expect(
      calculateSaleTotal([
        { quantity: "0.5000", unitPrice: "9.2500" },
        { quantity: "2", unitPrice: "3.00" },
      ]),
    ).toBe("10.625");
  });

  it("adds differently scaled quantities and retains large integer precision", () => {
    expect(addSaleDecimals(["0.0001", "0.01", "2"])).toBe("2.0101");
    expect(multiplySaleDecimals("9007199254740993", "2")).toBe(
      "18014398509481986",
    );
  });

  it("treats an empty cart as zero and rejects malformed decimal text", () => {
    expect(calculateSaleTotal([])).toBe("0");
    expect(() => multiplySaleDecimals("1e-2", "3")).toThrow();
  });
});
