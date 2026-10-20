import { describe, expect, it } from "vitest";
import { addPurchaseQuantity, purchaseAmount } from "./purchase-totals";

describe("restock previews", () => {
  it("adds stock exactly without floating-point drift", () => {
    expect(addPurchaseQuantity("20.25", "2.5")).toBe("22.75");
    expect(addPurchaseQuantity("0.1", "0.2")).toBe("0.3");
    expect(addPurchaseQuantity("0", "12")).toBe("12");
    expect(addPurchaseQuantity("1.95", "0.05")).toBe("2");
  });
  it("waits for complete values before showing amounts", () => {
    expect(addPurchaseQuantity("20", "")).toBeNull();
    expect(
      purchaseAmount([{ quantity_received: "2", unit_cost: "" }]),
    ).toBeNull();
    expect(
      purchaseAmount([{ quantity_received: "2.5", unit_cost: "13.25" }]),
    ).toBe("33.125");
  });
});
