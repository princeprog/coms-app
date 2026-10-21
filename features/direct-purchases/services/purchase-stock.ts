import type { PurchaseStock } from "../schemas/purchase.schema";

/** Restock prefill from an inventory balance row. */
export function purchaseStockFromBalance(item: {
  id: string;
  stock_item_name: string;
  unit: string;
  is_active: boolean;
  quantity_on_hand: string;
}): PurchaseStock {
  return {
    id: item.id,
    stock_item_name: item.stock_item_name,
    unit: item.unit,
    is_active: item.is_active,
    quantity_on_hand: item.quantity_on_hand,
  };
}
