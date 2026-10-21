import { describe, expect, it } from "vitest";
import {
  changeText,
  changeTone,
  neighbourDate,
  periodLabel,
  peso,
} from "./report-format";

describe("sales report format", () => {
  it("formats money and changes", () => {
    expect(peso("1234.5")).toBe("₱1,234.50");
    expect(peso("-20.00")).toBe("−₱20.00");
    expect(changeText("12.5")).toBe("+12.5%");
    expect(changeText("-2.1", " pts")).toBe("−2.1 pts");
    expect(changeText(null)).toBe("No earlier sales");
    expect(changeTone("5")).toBe("good");
    expect(changeTone("5", true)).toBe("bad");
    expect(changeTone(null)).toBe("neutral");
  });

  it("labels periods and finds neighbouring periods", () => {
    expect(
      periodLabel({
        period: "week",
        period_range: { from: "2026-10-19", to: "2026-10-25" },
        range: { from: "2026-10-19", to: "2026-10-21" },
        in_progress: true,
      }),
    ).toBe("Oct 19 – Oct 25, 2026 (to Oct 21)");
    expect(neighbourDate("week", "2026-10-19", -1)).toBe("2026-10-12");
    expect(neighbourDate("month", "2026-01-01", -1)).toBe("2025-12-01");
    expect(neighbourDate("day", "2026-10-01", -1)).toBe("2026-09-30");
  });
});
