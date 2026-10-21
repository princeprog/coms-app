import { describe, expect, it } from "vitest";
import { activePreset, formatPeso, presetRange } from "./cost-format";

describe("cost formatting", () => {
  it("formats exact decimal pesos, including losses", () => {
    expect(formatPeso("1234.5")).toBe("₱1,234.50");
    expect(formatPeso("-50")).toBe("−₱50.00");
    expect(formatPeso(null)).toBe("—");
  });

  it("builds Manila business-date presets", () => {
    const now = new Date("2026-10-21T18:00:00.000Z"); // Oct 22, 02:00 Manila
    expect(presetRange("today", now)).toEqual({
      from: "2026-10-22",
      to: "2026-10-22",
    });
    expect(presetRange("7d", now)).toEqual({
      from: "2026-10-16",
      to: "2026-10-22",
    });
    expect(presetRange("month", now)).toEqual({
      from: "2026-10-01",
      to: "2026-10-22",
    });
    expect(activePreset("2026-10-16", "2026-10-22", now)).toBe("7d");
    expect(activePreset("2026-10-01", "2026-10-05", now)).toBeUndefined();
  });
});
