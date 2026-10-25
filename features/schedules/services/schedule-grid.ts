import type { ScheduleWeek } from "../schemas/schedule.schema";

export type CellPerson = {
  user_id: string;
  full_name: string;
  kind: "PATTERN" | "EXTRA" | "OFF";
  exception_id: string | null;
  reason: string | null;
};

export type ScheduleCell = {
  /** The shift normally runs on this weekday. */
  runs: boolean;
  people: CellPerson[];
  /** Branch staff who could be added for this date. */
  available: ScheduleWeek["staff"];
};

export const cellKey = (templateId: string, date: string) =>
  `${templateId}:${date}`;

const order = { PATTERN: 0, EXTRA: 0, OFF: 1 } as const;

/** Groups the week's shifts and days off by shift and date. */
export function buildScheduleCells(week: ScheduleWeek) {
  const cells = new Map<string, ScheduleCell>();
  for (const template of week.templates)
    for (const day of week.days)
      cells.set(cellKey(template.id, day.date), {
        runs: template.weekdays.includes(day.weekday),
        people: [],
        available: [],
      });
  for (const shift of week.shifts)
    cells.get(cellKey(shift.template_id, shift.work_date))?.people.push({
      user_id: shift.user_id,
      full_name: shift.full_name,
      kind: shift.source,
      exception_id: shift.exception_id,
      reason: null,
    });
  for (const off of week.off)
    cells.get(cellKey(off.template_id, off.work_date))?.people.push({
      user_id: off.user_id,
      full_name: off.full_name,
      kind: "OFF",
      exception_id: off.exception_id,
      reason: off.reason,
    });
  for (const cell of cells.values()) {
    cell.people.sort(
      (a, b) =>
        order[a.kind] - order[b.kind] || a.full_name.localeCompare(b.full_name),
    );
    const taken = new Set(cell.people.map((person) => person.user_id));
    cell.available = week.staff.filter((member) => !taken.has(member.user_id));
  }
  return cells;
}

/** A person's weekly pattern as "templateId:weekday" keys. */
export function patternKeys(week: ScheduleWeek, userId: string) {
  return new Set(
    week.pattern
      .filter((row) => row.user_id === userId)
      .map((row) => `${row.template_id}:${row.weekday}`),
  );
}
