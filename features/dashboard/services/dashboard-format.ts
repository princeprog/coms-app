const MANILA = "Asia/Manila";

export function timeOfDay(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function businessDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

/** "just now", "3 min ago", "2 hr ago". */
export function weekdayShort(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

/** "13:00" → "1 PM". */
export function hourLabel(value: string) {
  const hour = Number(value.slice(0, 2));
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

/** "just now", "3 min ago", "2 hr ago". */
export function updatedAgo(value: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}
