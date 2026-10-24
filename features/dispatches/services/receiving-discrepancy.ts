import type {
  Dispatch,
  DispatchCountDifference,
} from "../types/dispatch.types";

/** Items whose final count differs from the quantity sent. */
export function countDifferences(
  items: Dispatch["items"],
): DispatchCountDifference[] {
  return items.flatMap((item) =>
    item.quantity_variance != null && /[1-9]/.test(item.quantity_variance)
      ? [
          {
            stock_item_name: item.stock_item_name,
            unit: item.unit,
            quantity_variance: item.quantity_variance,
          },
        ]
      : [],
  );
}
