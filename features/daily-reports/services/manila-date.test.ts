import { describe, expect, it } from "vitest";

async function getManilaDateModule() {
  return import("./manila-date").catch(() => null);
}

describe("Manila business date", () => {
  it("uses the calendar date in Asia/Manila rather than the host timezone", async () => {
    const dateModule = await getManilaDateModule();
    expect(dateModule).not.toBeNull();
    if (!dateModule) return;

    expect(
      dateModule.getTodayManilaDate(new Date("2026-09-23T16:30:00.000Z")),
    ).toBe("2026-09-24");
  });
});
