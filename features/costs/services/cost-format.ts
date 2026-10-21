const MANILA = "Asia/Manila";

// Exact decimal strings formatted as pesos without float rounding drift.
export function formatPeso(value: string | null) {
  if (value === null) return "—";
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const amount =
    "₱" +
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    "." +
    fraction.padEnd(2, "0").slice(0, 2);
  return negative ? `−${amount}` : amount;
}

export function formatPercent(value: string | null) {
  return value === null ? "—" : `${value}%`;
}

export function manilaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shift(date: string, days: number) {
  const time = Date.parse(`${date}T00:00:00.000Z`) + days * 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

export const rangePresets = ["today", "7d", "month"] as const;
export type RangePreset = (typeof rangePresets)[number];

export function presetRange(preset: RangePreset, now = new Date()) {
  const today = manilaToday(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d") return { from: shift(today, -6), to: today };
  return { from: `${today.slice(0, 8)}01`, to: today };
}

export function activePreset(from: string, to: string, now = new Date()) {
  return rangePresets.find((preset) => {
    const range = presetRange(preset, now);
    return range.from === from && range.to === to;
  });
}

export function formatBusinessDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
