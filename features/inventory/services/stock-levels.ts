import type { InventoryItem } from "../types/inventory.types";

const SCALE = 1000;

/** Exact for the 3-decimal quantities COMS stores. */
function thousandths(value: string) {
  return Math.round(Number(value) * SCALE);
}

function fromThousandths(value: number) {
  return String(value / SCALE);
}

/** Quantity that brings the item back to its target, or null when not low. */
export function restockQuantity(item: InventoryItem) {
  if (item.target_level === null || item.reorder_level === null) return null;
  const position =
    thousandths(item.quantity_on_hand) + thousandths(item.on_the_way);
  if (position > thousandths(item.reorder_level)) return null;
  const missing = thousandths(item.target_level) - position;
  return missing > 0 ? fromThousandths(missing) : null;
}

export function isZeroQuantity(value: string) {
  return thousandths(value) === 0;
}
