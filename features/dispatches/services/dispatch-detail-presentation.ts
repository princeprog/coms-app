import type { Dispatch, DispatchItem } from "../types/dispatch.types";

export const dispatchDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});
export const dispatchTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});
export function dispatchTimestamp(value: string) {
  return `${dispatchDate.format(new Date(value))}, ${dispatchTime.format(new Date(value))} PHT`;
}

export function receivedPercentage(received: string, dispatched: string) {
  const [receivedWhole, receivedFraction = ""] = received.split(".");
  const [sentWhole, sentFraction = ""] = dispatched.split(".");
  const scale = Math.max(receivedFraction.length, sentFraction.length);
  const numerator = BigInt(receivedWhole + receivedFraction.padEnd(scale, "0"));
  const denominator = BigInt(sentWhole + sentFraction.padEnd(scale, "0"));
  if (denominator === BigInt(0)) return 0;
  return Math.min(100, Number((numerator * BigInt(1000)) / denominator) / 10);
}

export type VarianceLine = {
  item: DispatchItem;
  direction: "short" | "surplus";
  amount: string;
};

/** Lines whose counted quantity still differs from what was sent. */
export function varianceLines(dispatch: Dispatch): VarianceLine[] {
  if (!dispatch.counted_at) return [];
  return dispatch.items.flatMap((item) => {
    const outstanding = item.quantity_outstanding;
    if (!outstanding || !/[1-9]/.test(outstanding)) return [];
    const surplus = outstanding.startsWith("-");
    return [
      {
        item,
        direction: surplus ? "surplus" : "short",
        amount: surplus ? outstanding.slice(1) : outstanding,
      },
    ];
  });
}

export type DispatchActivity = {
  id: string;
  kind:
    | "created"
    | "dispatched"
    | "receipt"
    | "shortage"
    | "discrepancy"
    | "reminder";
  title: string;
  actor: string;
  timestamp: string;
  note?: string;
  lines?: { name: string; unit: string; quantity: string }[];
};

const eventTitles = {
  COUNT_REMINDER_SENT: "Count reminder sent",
  CREATED: "Dispatch created",
  DISPATCHED: "Dispatched",
  RECEIPT_RECORDED: "Branch count recorded",
  SHORTAGE_CLOSED: "Variance resolved",
};
const discrepancyTitles = {
  REPORTED: "Count variance flagged",
  RECOUNT_REQUESTED: "Recount requested",
  RESOLVED_RECEIVED: "Discrepancy resolved by receipt",
  RESOLVED_SHORTAGE: "Discrepancy resolved",
};
const outcomeTitles = {
  LOST: "Variance resolved: lost",
  NOT_LOADED: "Variance resolved: not loaded",
  SURPLUS: "Surplus confirmed",
};

export function buildDispatchActivity(dispatch: Dispatch): DispatchActivity[] {
  const entries: DispatchActivity[] = dispatch.events.flatMap((event) => {
    if (
      event.dispatch_receipt_id &&
      dispatch.receipts.some(
        (receipt) => receipt.id === event.dispatch_receipt_id,
      )
    )
      return [];
    if (
      event.shortage_closure_id &&
      dispatch.shortage_closures.some(
        (closure) => closure.id === event.shortage_closure_id,
      )
    )
      return [];
    const kind =
      event.event_type === "COUNT_REMINDER_SENT"
        ? "reminder"
        : event.event_type === "CREATED"
          ? "created"
          : event.event_type === "DISPATCHED"
            ? "dispatched"
            : event.event_type === "SHORTAGE_CLOSED"
              ? "shortage"
              : "receipt";
    return [
      {
        id: `event-${event.id}`,
        kind,
        title: eventTitles[event.event_type],
        actor: event.actor_name,
        timestamp: event.created_at,
      },
    ];
  });
  if (!dispatch.events.some((event) => event.event_type === "CREATED")) {
    entries.unshift({
      id: "created",
      kind: "created",
      title: "Dispatch created",
      actor: dispatch.created_by_name,
      timestamp: dispatch.created_at,
    });
  }
  if (
    dispatch.dispatched_at &&
    !dispatch.events.some((event) => event.event_type === "DISPATCHED")
  ) {
    entries.push({
      id: "dispatched",
      kind: "dispatched",
      title: "Dispatched",
      actor: dispatch.dispatched_by_name ?? "Not recorded",
      timestamp: dispatch.dispatched_at,
    });
  }
  const sortedReceipts = [...dispatch.receipts].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  sortedReceipts.forEach((receipt, index) =>
    entries.push({
      id: `receipt-${receipt.id}`,
      kind: "receipt",
      title:
        dispatch.counted_at && index === sortedReceipts.length - 1
          ? "Final count submitted"
          : "Partial receipt recorded",
      actor: receipt.receiver_name,
      timestamp: receipt.created_at,
      note: receipt.note ?? undefined,
      lines: receipt.items.map((item) => ({
        name: item.stock_item_name,
        unit: item.unit,
        quantity: item.quantity_received,
      })),
    }),
  );
  dispatch.shortage_closures.forEach((closure) =>
    entries.push({
      id: `shortage-${closure.id}`,
      kind: "shortage",
      title: outcomeTitles[closure.outcome ?? "LOST"],
      actor: closure.closer_name,
      timestamp: closure.created_at,
      note: closure.reason,
      lines: closure.items.map((item) => ({
        name: item.stock_item_name,
        unit: item.unit,
        quantity: item.quantity_closed,
      })),
    }),
  );
  const receiptNotes = new Set(
    dispatch.receipts.map((receipt) => receipt.note),
  );
  dispatch.discrepancy_events?.forEach((event) =>
    entries.push({
      id: `discrepancy-${event.id}`,
      kind: "discrepancy",
      title: discrepancyTitles[event.event_type],
      actor: event.actor_name,
      timestamp: event.created_at,
      // The branch's count note is already shown on the count entry.
      note:
        event.event_type === "REPORTED" && receiptNotes.has(event.note)
          ? undefined
          : event.note,
    }),
  );
  if (
    dispatch.discrepancy &&
    !dispatch.discrepancy_events?.some(
      (event) => event.event_type === "REPORTED",
    )
  ) {
    entries.push({
      id: "discrepancy-reported",
      kind: "discrepancy",
      title: "Count variance flagged",
      actor: dispatch.discrepancy.reported_by_name,
      timestamp: dispatch.discrepancy.reported_at,
    });
  }
  const order = {
    created: 0,
    dispatched: 1,
    receipt: 2,
    shortage: 3,
    discrepancy: 4,
    reminder: 5,
  };
  return entries.sort(
    (a, b) =>
      Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
      order[a.kind] - order[b.kind],
  );
}
