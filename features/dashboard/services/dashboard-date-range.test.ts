import { describe, expect, it } from "vitest";
import { getDashboardDateRange } from "./dashboard-date-range";

describe("dashboard Manila date ranges", () => {
  it.each([7, 30, 90] as const)("returns %i Manila business dates", (days) => {
    const range = getDashboardDateRange(
      days,
      new Date("2026-09-28T16:30:00.000Z"),
    );
    expect(range.to).toBe("2026-09-29");
    const elapsed =
      (Date.parse(`${range.to}T00:00:00Z`) -
        Date.parse(`${range.from}T00:00:00Z`)) /
        86_400_000 +
      1;
    expect(elapsed).toBe(days);
  });
});
