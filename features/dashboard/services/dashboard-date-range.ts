export type DashboardRangeDays = 7 | 30 | 90;
export type DashboardDateRange = { from: string; to: string };

export function getDashboardDateRange(
  days: DashboardRangeDays,
  now = new Date(),
): DashboardDateRange {
  const today = getManilaToday(now);
  const end = new Date(`${today}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - (days - 1));
  return { from: end.toISOString().slice(0, 10), to: today };
}

function getManilaToday(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
