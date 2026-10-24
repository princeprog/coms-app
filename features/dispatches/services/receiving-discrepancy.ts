import type {
  Dispatch,
  DispatchCountDifference,
} from "../types/dispatch.types";
import { completedDifference } from "./dispatch-completion-summary";

const LISTED_ITEMS = 3;

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

/** "Flour: 2 kg over · Sugar: 1.5 kg short. The commissary will review…" */
export function discrepancyDescription(differences: DispatchCountDifference[]) {
  const listed = differences
    .slice(0, LISTED_ITEMS)
    .map(
      (item) =>
        `${item.stock_item_name}: ${completedDifference(item.quantity_variance, item.unit)}`,
    )
    .join(" · ");
  const more = differences.length - LISTED_ITEMS;
  return `${listed}${more > 0 ? ` and ${more} more` : ""}. The commissary will review the difference.`;
}
