import type { Dispatch } from "../types/dispatch.types";

export function isDispatchComplete(dispatch: Dispatch) {
  return (
    dispatch.status === "RECEIVED" || dispatch.status === "CLOSED_WITH_SHORTAGE"
  );
}

export function dispatchCompletionSummary(dispatch: Dispatch) {
  const receipts = [...dispatch.receipts].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  const completionDates = [
    dispatch.counted_at,
    dispatch.discrepancy?.resolved_at,
    ...receipts.map((receipt) => receipt.created_at),
    ...dispatch.shortage_closures.map((closure) => closure.created_at),
  ].filter((value): value is string => Boolean(value));
  const completedAt = completionDates.sort(
    (a, b) => Date.parse(b) - Date.parse(a),
  )[0];
  const resolutions = new Map<
    string,
    {
      id: string;
      quantity: string;
      outcome: string;
      reason: string;
    }[]
  >();
  const outcomes = {
    LOST: "Lost",
    NOT_LOADED: "Not loaded",
    SURPLUS: "Surplus confirmed",
  };
  for (const closure of dispatch.shortage_closures) {
    for (const item of closure.items) {
      const entries = resolutions.get(item.dispatch_item_id) ?? [];
      entries.push({
        id: item.closure_item_id,
        quantity: item.quantity_closed,
        outcome: outcomes[closure.outcome ?? "LOST"],
        reason: closure.reason,
      });
      resolutions.set(item.dispatch_item_id, entries);
    }
  }
  return {
    completedAt: completedAt ?? null,
    countedBy:
      dispatch.counted_by_name ??
      receipts.at(-1)?.receiver_name ??
      "Not recorded",
    notes: receipts.filter((receipt) => receipt.note?.trim()),
    resolutions,
  };
}

export function completedDifference(
  value: string | null | undefined,
  unit: string,
) {
  if (value == null) return "Not recorded";
  if (!/[1-9]/.test(value)) return "Matched";
  return value.startsWith("-")
    ? `${value.slice(1)} ${unit} short`
    : `${value.replace(/^\+/, "")} ${unit} over`;
}
