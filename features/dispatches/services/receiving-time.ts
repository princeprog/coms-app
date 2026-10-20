export function manilaDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
export function defaultReceiveBy() {
  return new Date(Date.now() + 32 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function receiveByIso(value: string) {
  const date = new Date(`${value}:00+08:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}
export const receivingTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
