import type { ReportPeriod, SalesReport } from "../schemas/sales-report.schema";

const DAY_MS = 86_400_000;

/** ₱1,234.50 from an exact decimal string; negatives as −₱. */
export function peso(value: string | null | undefined) {
  if (value === null || value === undefined) return "—";
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const amount = `₱${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0").slice(0, 2)}`;
  return negative ? `−${amount}` : amount;
}

export function count(value: string | number) {
  const [whole, fraction] = String(value).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function percent(value: string | null) {
  return value === null ? "—" : `${value}%`;
}

export function serviceLabel(value: string) {
  return value === "DINE_IN"
    ? "Dine-in"
    : value === "TAKEAWAY"
      ? "Takeout"
      : value;
}

function format(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export const shortDate = (value: string) =>
  format(value, { month: "short", day: "numeric" });
export const weekdayDate = (value: string) =>
  format(value, { weekday: "short", month: "short", day: "numeric" });

export function manilaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** First date of the day, Monday-start week or month containing the date. */
export function periodStartOf(period: ReportPeriod, date: string) {
  if (period === "day") return date;
  if (period === "month") return `${date.slice(0, 8)}01`;
  const weekday = (new Date(`${date}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  return addDays(date, -weekday);
}

const relativeNames: Record<ReportPeriod, [string, string]> = {
  day: ["Today", "Yesterday"],
  week: ["This week", "Last week"],
  month: ["This month", "Last month"],
};

/** "This week", "Last month", … or null for older periods. */
export function relativeName(
  period: ReportPeriod,
  periodFrom: string,
  today = manilaToday(),
) {
  const current = periodStartOf(period, today);
  if (periodFrom === current) return relativeNames[period][0];
  if (periodFrom === neighbourDate(period, current, -1))
    return relativeNames[period][1];
  return null;
}

export function currentPeriodName(period: ReportPeriod) {
  return relativeNames[period][0];
}

/** Compact calendar label: "Wed, Oct 21, 2026", "Oct 19 – 25, 2026", "October 2026". */
export function rangeLabel(
  report: Pick<SalesReport, "period" | "period_range">,
) {
  const { from, to } = report.period_range;
  if (report.period === "day")
    return format(from, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (report.period === "month")
    return format(from, { month: "long", year: "numeric" });
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const end = sameMonth
    ? `${Number(to.slice(8, 10))}, ${to.slice(0, 4)}`
    : format(to, { month: "short", day: "numeric", year: "numeric" });
  return `${shortDate(from)} – ${end}`;
}

/** Name of the comparison period, e.g. "Last week, same days". */
export function previousLabel(
  report: Pick<SalesReport, "period" | "in_progress">,
) {
  if (report.period === "day") return "Previous day";
  const name = report.period === "week" ? "Last week" : "Last month";
  return report.in_progress ? `${name}, same days` : name;
}

export function comparisonLabel(
  report: Pick<SalesReport, "period" | "in_progress">,
) {
  if (report.period === "day") return "vs previous day";
  const unit = report.period === "week" ? "week" : "month";
  return report.in_progress
    ? `vs same point last ${unit}`
    : `vs previous ${unit}`;
}

function addDays(value: string, days: number) {
  return new Date(Date.parse(`${value}T00:00:00.000Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Any date inside the neighbouring period. */
export function neighbourDate(
  period: ReportPeriod,
  periodStart: string,
  step: 1 | -1,
) {
  if (period === "day") return addDays(periodStart, step);
  if (period === "week") return addDays(periodStart, step * 7);
  const [year, month] = periodStart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + step, 1))
    .toISOString()
    .slice(0, 10);
}

/** Change direction: good, bad or neutral given whether rising is bad. */
export function changeTone(value: string | null, risingIsBad = false) {
  if (value === null || Number(value) === 0) return "neutral" as const;
  return Number(value) > 0 !== risingIsBad
    ? ("good" as const)
    : ("bad" as const);
}

export function changeText(value: string | null, unit = "%") {
  if (value === null) return "No earlier sales";
  const number = Number(value);
  if (number === 0) return `No change`;
  return `${number > 0 ? "+" : "−"}${Math.abs(number)}${unit}`;
}
