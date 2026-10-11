import type { Dispatch } from "../types/dispatch.types";
import { isDecimalQuantityWithinLimit } from "./decimal-quantity";

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

export type DispatchActivity = {
  id: string;
  kind: "created" | "dispatched" | "receipt" | "shortage" | "discrepancy";
  title: string;
  actor: string;
  timestamp: string;
  note?: string;
  lines?: { name: string; unit: string; quantity: string }[];
};

const eventTitles = {
  CREATED: "Dispatch created",
  DISPATCHED: "Dispatched",
  RECEIPT_RECORDED: "Branch receipt recorded",
  SHORTAGE_CLOSED: "Shortage closed",
};
const discrepancyTitles = {
  REPORTED: "Discrepancy reported",
  RECOUNT_REQUESTED: "Recount requested",
  RESOLVED_RECEIVED: "Discrepancy resolved by receipt",
  RESOLVED_SHORTAGE: "Discrepancy resolved by shortage closure",
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
      event.event_type === "CREATED"
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
  dispatch.receipts.forEach((receipt) =>
    entries.push({
      id: `receipt-${receipt.id}`,
      kind: "receipt",
      title:
        receipt.items.length === dispatch.items.length &&
        receipt.items.every((line) => {
          const item = dispatch.items.find(
            (item) => item.id === line.dispatch_item_id,
          );
          return (
            item &&
            isDecimalQuantityWithinLimit(
              item.quantity_dispatched,
              line.quantity_received,
            )
          );
        })
          ? "Receipt recorded"
          : "Partial receipt recorded",
      actor: receipt.receiver_name,
      timestamp: receipt.created_at,
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
      title: "Shortage closed",
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
  dispatch.discrepancy_events?.forEach((event) =>
    entries.push({
      id: `discrepancy-${event.id}`,
      kind: "discrepancy",
      title: discrepancyTitles[event.event_type],
      actor: event.actor_name,
      timestamp: event.created_at,
      note: event.note,
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
      title: "Discrepancy reported",
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
  };
  return entries.sort(
    (a, b) =>
      Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
      order[a.kind] - order[b.kind],
  );
}
