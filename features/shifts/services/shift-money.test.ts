import { describe, expect, it } from "vitest";
import { subtractAmounts } from "./shift-money";

describe("subtractAmounts", () => {
  it("subtracts peso strings exactly", () => {
    expect(subtractAmounts("1690.5", "1000")).toBe("690.5");
    expect(subtractAmounts("0.3", "0.1")).toBe("0.2");
    expect(subtractAmounts("500", "500.25")).toBe("-0.25");
    expect(subtractAmounts("12000", "0")).toBe("12000");
  });
});
