import { describe, expect, it } from "vitest";
import {
  checkUpdateSafety,
  registerPwaUpdateSafetyCheck,
} from "./update-safety";

describe("update safety", () => {
  it("blocks when the cart and durable outbox owners have not connected", async () => {
    expect(await checkUpdateSafety()).toBe(false);
  });
  it("requires both owners and freshly reads their state on every attempt", async () => {
    let pending = 1;
    const cart = registerPwaUpdateSafetyCheck("cart", () => true);
    expect(await checkUpdateSafety()).toBe(false);
    const outbox = registerPwaUpdateSafetyCheck(
      "outbox",
      async () => pending === 0,
    );
    expect(await checkUpdateSafety()).toBe(false);
    pending = 0;
    expect(await checkUpdateSafety()).toBe(true);
    pending = 1;
    expect(await checkUpdateSafety()).toBe(false);
    cart();
    outbox();
    expect(await checkUpdateSafety()).toBe(false);
  });
  it("blocks on read errors or any mounted owner with unsaved work", async () => {
    const cart = registerPwaUpdateSafetyCheck("cart", () => true);
    const secondCart = registerPwaUpdateSafetyCheck("cart", () => false);
    const outbox = registerPwaUpdateSafetyCheck("outbox", () => true);
    expect(await checkUpdateSafety()).toBe(false);
    secondCart();
    const broken = registerPwaUpdateSafetyCheck("outbox", () => {
      throw new Error("database unavailable");
    });
    expect(await checkUpdateSafety()).toBe(false);
    broken();
    cart();
    outbox();
  });
});
