import { describe, expect, it } from "vitest";
import type { ScheduleWeek } from "../schemas/schedule.schema";
import { buildScheduleCells, cellKey, patternKeys } from "./schedule-grid";
import { crossesDayStart, weekdaysLabel, weekStartOf } from "./schedule-format";

const ids = {
  morning: "10000000-0000-4000-8000-000000000001",
  ana: "20000000-0000-4000-8000-000000000001",
  ben: "20000000-0000-4000-8000-000000000002",
  off: "30000000-0000-4000-8000-000000000001",
};

const week: ScheduleWeek = {
  branch: {
    id: "40000000-0000-4000-8000-000000000001",
    name: "Ermita",
    is_active: true,
  },
  week_start: "2026-10-26",
  days: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-10-${26 + index}`.replace("2026-10-32", "2026-11-01"),
    weekday: index + 1,
    is_past: false,
  })),
  business_today: "2026-10-25",
  day_start_time: "00:00",
  templates: [
    {
      id: ids.morning,
      name: "Morning",
      start_time: "06:00",
      end_time: "14:00",
      weekdays: [1, 2, 3, 4, 5],
    },
  ],
  staff: [
    { user_id: ids.ana, full_name: "Ana Reyes", role_name: "Cashier" },
    { user_id: ids.ben, full_name: "Ben Cruz", role_name: "Cashier" },
  ],
  pattern: [{ user_id: ids.ana, template_id: ids.morning, weekday: 1 }],
  shifts: [
    {
      work_date: "2026-10-27",
      user_id: ids.ben,
      full_name: "Ben Cruz",
      template_id: ids.morning,
      source: "EXTRA",
      exception_id: ids.off,
      starts_at: "2026-10-26T22:00:00.000Z",
      ends_at: "2026-10-27T06:00:00.000Z",
    },
  ],
  off: [
    {
      exception_id: ids.off,
      work_date: "2026-10-26",
      user_id: ids.ana,
      full_name: "Ana Reyes",
      template_id: ids.morning,
      reason: "Leave",
    },
  ],
};

describe("schedule grid", () => {
  it("groups shifts and days off by shift and date", () => {
    const cells = buildScheduleCells(week);
    const monday = cells.get(cellKey(ids.morning, "2026-10-26"))!;
    expect(monday.runs).toBe(true);
    expect(monday.people).toEqual([
      expect.objectContaining({
        user_id: ids.ana,
        kind: "OFF",
        reason: "Leave",
      }),
    ]);
    expect(monday.available.map((member) => member.user_id)).toEqual([ids.ben]);
    const tuesday = cells.get(cellKey(ids.morning, "2026-10-27"))!;
    expect(tuesday.people[0]).toMatchObject({
      user_id: ids.ben,
      kind: "EXTRA",
    });
    expect(cells.get(cellKey(ids.morning, "2026-11-01"))!.runs).toBe(false);
    expect([...patternKeys(week, ids.ana)]).toEqual([`${ids.morning}:1`]);
  });

  it("describes days and the business day boundary", () => {
    expect(weekdaysLabel([1, 2, 3, 4, 5])).toBe("Mon – Fri");
    expect(weekdaysLabel([7, 6])).toBe("Weekends");
    expect(weekdaysLabel([1, 3, 5])).toBe("Mon, Wed, Fri");
    expect(crossesDayStart("22:00", "06:00", "00:00")).toBe(true);
    expect(crossesDayStart("22:00", "06:00", "06:00")).toBe(false);
    expect(weekStartOf("2026-11-01")).toBe("2026-10-26");
  });
});
