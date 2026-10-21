import { z } from "zod";

const quantity = z.string().regex(/^-?\d+(?:\.\d+)?$/);

export const restockSuggestionSchema = z.object({
  stock_item_id: z.uuid(),
  stock_item_name: z.string().min(1),
  unit: z.string().min(1),
  on_hand: quantity,
  on_the_way: quantity,
  reorder_level: quantity,
  target_level: quantity,
  suggested_quantity: quantity,
  quantity_to_send: quantity,
  /** Null when the user cannot see commissary balances. */
  commissary_available: quantity.nullable(),
});

export const restockSuggestionsSchema = z.object({
  branch_id: z.uuid(),
  items: z.array(restockSuggestionSchema),
});

export type RestockSuggestion = z.infer<typeof restockSuggestionSchema>;
