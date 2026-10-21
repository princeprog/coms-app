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

export function periodLabel(
  report: Pick<
    SalesReport,
    "period" | "period_range" | "range" | "in_progress"
  >,
) {
  const { period, period_range: full, range } = report;
  if (period === "day")
    return format(range.from, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const label =
    period === "month"
      ? format(full.from, { month: "long", year: "numeric" })
      : `${shortDate(full.from)} – ${format(full.to, { month: "short", day: "numeric", year: "numeric" })}`;
  return report.in_progress ? `${label} (to ${shortDate(range.to)})` : label;
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
