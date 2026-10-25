import type { ReportPeriod, SalesReport } from "../schemas/sales-report.schema";

export {
  changeText,
  changeTone,
  count,
  percent,
  peso,
} from "@/lib/metric-format";

const DAY_MS = 86_400_000;

/** Whole pesos for chart labels, e.g. ₱3,718. */
export function roundedPeso(value: number) {
  const amount = `₱${Math.round(Math.abs(value)).toLocaleString("en-PH")}`;
  return value < 0 ? `−${amount}` : amount;
}

/** Most categories a chart shows before folding the rest into "Other". */
export const CATEGORY_SLICE_LIMIT = 8;

export type CategorySlice = {
  key: string;
  name: string;
  value: number;
  netSales: string;
  share: string | null;
  other: boolean;
};

/** Category rows as chart slices, folding the smallest into "Other". */
export function categorySlices(
  rows: SalesReport["by_category"],
): CategorySlice[] {
  const slice = (
    row: SalesReport["by_category"][number],
    index: number,
  ): CategorySlice => ({
    key: `category-${index}`,
    name: row.name,
    value: Number(row.net_sales),
    netSales: row.net_sales,
    share: row.share_percent,
    other: false,
  });
  if (rows.length <= CATEGORY_SLICE_LIMIT) return rows.map(slice);
  const kept = rows.slice(0, CATEGORY_SLICE_LIMIT - 1);
  const rest = rows.slice(CATEGORY_SLICE_LIMIT - 1);
  const cents = rest.reduce(
    (sum, row) => sum + Math.round(Number(row.net_sales) * 100),
    0,
  );
  const share = rest.reduce(
    (sum, row) => sum + Number(row.share_percent ?? 0),
    0,
  );
  return [
    ...kept.map(slice),
    {
      key: "category-other",
      name: `Other (${rest.length})`,
      value: cents / 100,
      netSales: (cents / 100).toFixed(2),
      share: rest.every((row) => row.share_percent === null)
        ? null
        : String(Math.round(share * 10) / 10),
      other: true,
    },
  ];
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
