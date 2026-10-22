/** Display a decimal quantity without trailing zeros, e.g. "10.000" → "10". */
export function formatQuantity(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const digits = fraction.replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const zero = !/[1-9]/.test(whole + digits);
  return `${negative && !zero ? "−" : ""}${grouped}${digits ? `.${digits}` : ""}`;
}

export function withUnit(value: string | null | undefined, unit: string) {
  const formatted = formatQuantity(value);
  return formatted === null ? null : `${formatted} ${unit}`;
}

/** True for a well-formed nonzero quantity, which then needs a reason. */
export const isNonZeroQuantity = (value: string) => /[1-9]/.test(value);

export type VarianceTone = "match" | "short" | "over";

export function varianceTone(value: string): VarianceTone {
  if (!isNonZeroQuantity(value)) return "match";
  return value.startsWith("-") ? "short" : "over";
}
