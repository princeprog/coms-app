import type { DispatchCreateLine } from "../components/dispatch-create-line-fields";
import type { RestockSuggestion } from "../schemas/restock-suggestion.schema";

const isZero = (value: string) => Number(value) === 0;

export function restockHint(suggestion: RestockSuggestion) {
  const unit = suggestion.unit;
  const capped = suggestion.quantity_to_send !== suggestion.suggested_quantity;
  return [
    `Suggested ${suggestion.suggested_quantity} ${unit}`,
    `on hand ${suggestion.on_hand}`,
    ...(isZero(suggestion.on_the_way)
      ? []
      : [`${suggestion.on_the_way} on the way`]),
    `target ${suggestion.target_level}`,
    ...(capped && suggestion.commissary_available !== null
      ? [`only ${suggestion.commissary_available} at commissary`]
      : []),
  ].join(" · ");
}

/**
 * Adds a line per suggestion with stock to send, skipping items already on
 * the dispatch. A single untouched empty line is replaced.
 */
export function addRestockLines(
  lines: DispatchCreateLine[],
  suggestions: RestockSuggestion[],
  nextKey: () => number,
) {
  const present = new Set(lines.map((line) => line.stock_item_id));
  const sendable = suggestions.filter(
    (item) =>
      !isZero(item.quantity_to_send) && !present.has(item.stock_item_id),
  );
  const added: DispatchCreateLine[] = sendable.map((item) => ({
    key: nextKey(),
    stock_item_id: item.stock_item_id,
    quantity_dispatched: item.quantity_to_send,
    stock: {
      id: item.stock_item_id,
      stock_item_name: item.stock_item_name,
      unit: item.unit,
      is_active: true,
      quantity_on_hand: item.commissary_available,
    },
    hint: restockHint(item),
  }));
  const untouched =
    lines.length === 1 &&
    !lines[0].stock_item_id &&
    !lines[0].quantity_dispatched.trim();
  return {
    lines: untouched && added.length ? added : [...lines, ...added],
    added: added.length,
    unavailable: suggestions.filter((item) => isZero(item.quantity_to_send)),
  };
}
