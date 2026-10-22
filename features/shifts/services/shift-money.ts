const peso = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an exact decimal string as pesos without floating-point rounding surprises in display. */
export function formatPeso(value: string | null | undefined) {
  if (value === null || value === undefined) return "—";
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const cents = fraction.padEnd(2, "0");
  const rounded =
    cents.length > 2
      ? Number(`${whole}.${cents}`).toFixed(2)
      : `${whole}.${cents}`;
  const [w, f] = rounded.split(".");
  const grouped = w.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}₱${grouped}.${f}`;
}

export type DifferenceTone = "balanced" | "over" | "short";

export function differenceTone(
  value: string | null | undefined,
): DifferenceTone {
  if (!value || /^-?0(?:\.0+)?$/.test(value)) return "balanced";
  return value.startsWith("-") ? "short" : "over";
}

export function differenceLabel(value: string | null | undefined) {
  const tone = differenceTone(value);
  if (tone === "balanced") return "Balanced";
  return `${tone === "short" ? "Short" : "Over"} ${formatPeso(value!.replace("-", ""))}`;
}

export { peso as pesoFormatter };

function scaled(value: string, digits: number) {
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const result = BigInt(whole + fraction.padEnd(digits, "0"));
  return negative ? -result : result;
}

/** Exact decimal subtraction for peso strings, such as cash removed from a drawer. */
export function subtractAmounts(left: string, right: string) {
  const digits = Math.max(
    ...[left, right].map((value) => value.split(".")[1]?.length ?? 0),
  );
  const result = scaled(left, digits) - scaled(right, digits);
  const negative = result < BigInt(0);
  const text = (negative ? -result : result)
    .toString()
    .padStart(digits + 1, "0");
  const whole = text.slice(0, text.length - digits);
  return `${negative ? "-" : ""}${whole}${digits ? `.${text.slice(-digits)}` : ""}`;
}

/** Exact sum of peso strings; null when every value is missing. */
export function sumAmounts(values: (string | null | undefined)[]) {
  const present = values.filter((value): value is string => value != null);
  if (!present.length) return null;
  return present.reduce(
    (total, value) =>
      subtractAmounts(
        total,
        value.startsWith("-") ? value.slice(1) : `-${value}`,
      ),
    "0",
  );
}

/** Share of a total for proportion bars, clamped to 0–1. */
export function shareOf(part: string, total: string) {
  const whole = Number(total);
  if (!whole) return 0;
  return Math.min(1, Math.max(0, Number(part) / whole));
}

export const isZeroAmount = (value: string | null | undefined) =>
  !value || /^-?0(?:\.0+)?$/.test(value);
