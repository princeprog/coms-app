const time = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});
const dateTime = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});
const day = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const shiftTime = (value: string) => time.format(new Date(value));
export const shiftDateTime = (value: string) =>
  dateTime.format(new Date(value));
export const businessDayLabel = (value: string) =>
  day.format(new Date(`${value}T00:00:00Z`));

const weekday = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const businessDayLong = (value: string) =>
  weekday.format(new Date(`${value}T00:00:00Z`));

/** Whole hours and minutes between two instants, e.g. "7h 45m". */
export function shiftDuration(start: string, end: string | Date) {
  const minutes = Math.max(
    0,
    Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  if (!hours) return `${minutes}m`;
  return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
}
