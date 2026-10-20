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
