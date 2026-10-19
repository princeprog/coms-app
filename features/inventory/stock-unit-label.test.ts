import { describe, expect, it } from "vitest";
import { stockUnitLabel } from "./stock-unit-label";

describe("stockUnitLabel", () => {
  it("expands inventory abbreviations regardless of capitalization or surrounding spaces", () => {
    expect(stockUnitLabel(" KG ")).toBe("Kilograms");
    expect(stockUnitLabel("L")).toBe("Liters");
    expect(stockUnitLabel("pcs.")).toBe("Pieces");
    expect(stockUnitLabel("bottle")).toBe("Bottles");
    expect(stockUnitLabel("portion")).toBe("Portions");
  });
  it("retains custom units without guessing a conversion", () => {
    expect(stockUnitLabel("Case of 24")).toBe("Case of 24");
    expect(stockUnitLabel("constructor")).toBe("constructor");
  });
});
