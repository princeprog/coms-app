import { describe, expect, it } from "vitest";
import {
  categorySlices,
  changeText,
  changeTone,
  neighbourDate,
  periodStartOf,
  rangeLabel,
  relativeName,
  peso,
  roundedPeso,
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
      rangeLabel({
        period: "week",
        period_range: { from: "2026-10-19", to: "2026-10-25" },
      }),
    ).toBe("Oct 19 – 25, 2026");
    expect(
      rangeLabel({
        period: "week",
        period_range: { from: "2026-09-28", to: "2026-10-04" },
      }),
    ).toBe("Sep 28 – Oct 4, 2026");
    expect(periodStartOf("week", "2026-10-25")).toBe("2026-10-19");
    expect(relativeName("week", "2026-10-19", "2026-10-21")).toBe("This week");
    expect(relativeName("week", "2026-10-12", "2026-10-21")).toBe("Last week");
    expect(relativeName("month", "2026-08-01", "2026-10-21")).toBeNull();
    expect(neighbourDate("week", "2026-10-19", -1)).toBe("2026-10-12");
    expect(neighbourDate("month", "2026-01-01", -1)).toBe("2025-12-01");
    expect(neighbourDate("day", "2026-10-01", -1)).toBe("2026-09-30");
  });

  it("folds categories beyond the chart limit into Other", () => {
    const row = (name: string, net: string, share: string | null) => ({
      name,
      quantity: "1",
      net_sales: net,
      share_percent: share,
      food_cost: null,
      gross_profit: null,
    });
    const eight = Array.from({ length: 8 }, (_, i) =>
      row(`Category ${i + 1}`, "100.00", "12.5"),
    );
    expect(categorySlices(eight)).toHaveLength(8);
    expect(categorySlices(eight).some((slice) => slice.other)).toBe(false);

    const ten = [
      ...eight.slice(0, 7),
      row("Sides", "0.10", "0.1"),
      row("Noodles", "0.20", "0.2"),
      row("Legacy items", "40.05", null),
    ];
    const slices = categorySlices(ten);
    expect(slices).toHaveLength(8);
    expect(slices[7]).toMatchObject({
      name: "Other (3)",
      netSales: "40.35",
      share: "0.3",
      other: true,
    });
    expect(roundedPeso(13439.5)).toBe("₱13,440");
    expect(roundedPeso(-20.4)).toBe("−₱20");
  });
});
