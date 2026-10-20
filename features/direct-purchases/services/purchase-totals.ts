import {
  calculateSupplierReceiptTotal,
  formatSupplierReceiptCost,
} from "@/features/supplier-receipts/services/supplier-receipt-total";
type AmountLine = { quantity_received: string; unit_cost: string };
export function purchaseAmount(lines: AmountLine[]) {
  if (
    !lines.length ||
    lines.some((line) =>
      [line.quantity_received, line.unit_cost].some(
        (value) => value.length > 80 || !/^\d+(?:\.\d+)?$/.test(value.trim()),
      ),
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
