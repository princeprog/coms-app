import {
  calculateSupplierReceiptTotal,
  formatSupplierReceiptCost,
} from "@/features/supplier-receipts/services/supplier-receipt-total";

type AmountLine = { quantity_received: string; unit_cost: string };
const DECIMAL = /^\d+(?:\.\d+)?$/;

export function isPurchaseDecimal(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 80 && DECIMAL.test(trimmed);
}

/** Exact PHP amount for the given lines, or null while any value is incomplete. */
export function purchaseAmount(lines: AmountLine[]) {
  if (
    !lines.length ||
    lines.some(
      (line) =>
        !isPurchaseDecimal(line.quantity_received) ||
        !isPurchaseDecimal(line.unit_cost),
    )
  )
    return null;
  return formatSupplierReceiptCost(
    calculateSupplierReceiptTotal({
      items: lines.map((line) => ({
        stock_item_id: "preview",
        quantity_received: line.quantity_received.trim(),
        unit_cost: line.unit_cost.trim(),
      })),
    }),
  );
}

/** Exact sum of two nonnegative decimal strings for the stock-after preview. */
export function addPurchaseQuantity(onHand: string, added: string) {
  if (!isPurchaseDecimal(onHand) || !isPurchaseDecimal(added)) return null;
  const [leftWhole, leftFraction = ""] = onHand.trim().split(".");
  const [rightWhole, rightFraction = ""] = added.trim().split(".");
  const scale = Math.max(leftFraction.length, rightFraction.length);
  const sum =
    BigInt(leftWhole + leftFraction.padEnd(scale, "0")) +
    BigInt(rightWhole + rightFraction.padEnd(scale, "0"));
  const digits = sum.toString().padStart(scale + 1, "0");
  if (!scale) return digits;
  const fraction = digits.slice(-scale).replace(/0+$/, "");
  return digits.slice(0, -scale) + (fraction ? "." + fraction : "");
}
