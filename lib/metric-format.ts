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

/** Change direction: good, bad or neutral given whether rising is bad. */
export function changeTone(value: string | null, risingIsBad = false) {
  if (value === null || Number(value) === 0) return "neutral" as const;
  return Number(value) > 0 !== risingIsBad
    ? ("good" as const)
    : ("bad" as const);
}

export function changeText(
  value: string | null,
  unit = "%",
  empty = "No earlier sales",
) {
  if (value === null) return empty;
  const number = Number(value);
  if (number === 0) return "No change";
  return `${number > 0 ? "+" : "−"}${Math.abs(number)}${unit}`;
}
