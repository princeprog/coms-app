export function manilaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function monthRange(now = new Date()) {
  const today = manilaToday(now);
  const [year, month] = today.split("-").map(Number);
  return {
    from: `${today.slice(0, 7)}-01`,
    to: `${today.slice(0, 7)}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`,
  };
}
export function cents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  // Receipt aggregates may retain more than two decimal places. Round once
  // for display, carrying into the whole amount entirely in integer space.
  const minorUnits = BigInt(fraction.slice(0, 2).padEnd(2, "0"));
  const roundUp = (fraction[2] ?? "0") >= "5" ? BigInt(1) : BigInt(0);
  return BigInt(whole) * BigInt(100) + minorUnits + roundUp;
}
export function pesos(value: string) {
  const amount = cents(value);
  return `₱${(amount / BigInt(100)).toLocaleString("en-PH")}.${(amount % BigInt(100)).toString().padStart(2, "0")}`;
}
export function expenseDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`));
}
export const sourceLabels = {
  OPERATING: "Operating expense",
  SUPPLIER_DELIVERY: "Supplier delivery",
  DIRECT_PURCHASE: "Direct purchase",
};
export const paymentLabels = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  EWALLET: "E-wallet",
  CARD: "Card",
  OTHER: "Other",
};
