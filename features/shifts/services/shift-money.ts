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
