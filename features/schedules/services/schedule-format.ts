export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 7, short: "Sun", long: "Sunday" },
] as const;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** "06:00" → "6:00 AM" */
export function clockLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** "6:00 AM – 2:00 PM" */
export function timeRange(start: string, end: string) {
  return `${clockLabel(start)} – ${clockLabel(end)}`;
}

export function shiftLength(start: string, end: string) {
  return (toMinutes(end) - toMinutes(start) + 1440) % 1440;
}

/** "8 h" or "8 h 30 min" */
export function lengthLabel(start: string, end: string) {
  const minutes = shiftLength(start, end);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** True when the business day's start falls strictly inside the shift. */
export function crossesDayStart(start: string, end: string, dayStart: string) {
  const offset = (toMinutes(dayStart) - toMinutes(start) + 1440) % 1440;
  return offset > 0 && offset < shiftLength(start, end);
}

/** Every half hour of the day, for time selects. */
export const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
  const value = `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
  return { value, label: clockLabel(value) };
});

/** "Every day", "Mon – Fri", "Weekends" or "Mon, Wed, Fri". */
export function weekdaysLabel(weekdays: number[]) {
  const sorted = [...new Set(weekdays)].sort((a, b) => a - b);
  if (sorted.length === 7) return "Every day";
  if (sorted.join() === "6,7") return "Weekends";
  const contiguous =
    sorted.length > 2 &&
    sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  const short = (day: number) => WEEKDAYS[day - 1]?.short ?? String(day);
  if (contiguous)
    return `${short(sorted[0])} – ${short(sorted[sorted.length - 1])}`;
  return sorted.map(short).join(", ");
}

const utc = (date: string) => new Date(`${date}T00:00:00.000Z`);
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-PH", { timeZone: "UTC", ...options }).format(
    utc(date),
  );

export function addDays(date: string, days: number) {
  const day = utc(date);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

export function weekStartOf(date: string) {
  const day = utc(date);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** "Mon, Oct 26" */
export const shortDate = (date: string) =>
  formatDate(date, { weekday: "short", month: "short", day: "numeric" });

/** "Oct 26" */
export const monthDay = (date: string) =>
  formatDate(date, { month: "short", day: "numeric" });

/** "Oct 26 – Nov 1, 2026" */
export function weekLabel(weekStart: string) {
  const end = addDays(weekStart, 6);
  return `${monthDay(weekStart)} – ${monthDay(end)}, ${end.slice(0, 4)}`;
}

export function isWeekStart(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = utc(value);
  return (
    !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === value
  );
}
