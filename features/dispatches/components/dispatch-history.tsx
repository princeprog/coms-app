import { format, parseISO } from "date-fns";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";

export function DispatchHistory({ dispatch }: { dispatch: Dispatch }) {
  const discrepancy = dispatch.discrepancy;
  const active = discrepancy && discrepancy.status !== "RESOLVED";
  const audit = dispatch.discrepancy_events ?? [];
  return (
    <div className="space-y-4">
      {discrepancy && (
        <section
          className="space-y-3 rounded-lg border bg-card p-4"
          aria-label="Receipt discrepancy"
        >
          <h2 className="text-sm font-semibold">
            Receipt discrepancy · {discrepancy.status.replaceAll("_", " ")}
          </h2>
          <p className="text-sm text-muted-foreground">
            Reported by {discrepancy.reported_by_name} ·{" "}
            {format(parseISO(discrepancy.reported_at), "PPp")}
          </p>
          {active && audit.at(-1)?.note && (
            <p className="text-sm">{audit.at(-1)?.note}</p>
          )}
          {audit.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm">
                Discrepancy audit history ({audit.length})
              </summary>
              <ol
                aria-label="Discrepancy audit history"
                className="mt-2 divide-y"
              >
                {audit.map((event) => (
                  <li key={event.id} className="space-y-1 py-3 text-sm">
                    <p className="font-medium">
                      {event.event_type.replaceAll("_", " ")} ·{" "}
                      {event.actor_name}
                    </p>
                    <p>{event.note}</p>
                    <time
                      className="text-muted-foreground"
                      dateTime={event.created_at}
                    >
                      {format(parseISO(event.created_at), "PPp")}
                    </time>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}
      {dispatch.events.length > 0 && (
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Dispatch history ({dispatch.events.length})
          </summary>
          <ol aria-label="Dispatch history" className="mt-2 divide-y">
            {dispatch.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span>
                  {event.event_type.replaceAll("_", " ")}
                  <span className="block text-muted-foreground">
                    {event.actor_name}
                  </span>
                </span>
                <time
                  className="text-muted-foreground"
                  dateTime={event.created_at}
                >
                  {format(parseISO(event.created_at), "PPp")}
                </time>
              </li>
            ))}
          </ol>
        </details>
      )}
      {dispatch.receipts.length > 0 && (
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Branch receipts ({dispatch.receipts.length})
          </summary>
          <ol aria-label="Branch receipt history" className="mt-2 divide-y">
            {dispatch.receipts.map((receipt) => (
              <li key={receipt.id} className="space-y-2 py-3 text-sm">
                <p className="font-medium">
                  {receipt.receiver_name} ·{" "}
                  {format(parseISO(receipt.created_at), "PPp")}
                </p>
                <ul className="text-muted-foreground">
                  {receipt.items.map((item) => (
                    <li key={item.receipt_item_id}>
                      {item.stock_item_name}: {item.quantity_received}{" "}
                      {item.unit}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      )}
      {dispatch.shortage_closures.length > 0 && (
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Shortage closures ({dispatch.shortage_closures.length})
          </summary>
          <ol aria-label="Shortage closure history" className="mt-2 divide-y">
            {dispatch.shortage_closures.map((closure) => (
              <li key={closure.id} className="space-y-2 py-3 text-sm">
                <p className="font-medium">
                  {closure.closer_name} ·{" "}
                  {format(parseISO(closure.created_at), "PPp")}
                </p>
                <p>{closure.reason}</p>
                <ul className="text-muted-foreground">
                  {closure.items.map((item) => (
                    <li key={item.closure_item_id}>
                      {item.stock_item_name}: {item.quantity_closed} {item.unit}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
