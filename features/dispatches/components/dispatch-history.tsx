import { format, parseISO } from "date-fns";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";

export function DispatchHistory({ dispatch }: { dispatch: Dispatch }) {
  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="dispatch-history-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="dispatch-history-heading" className="text-lg font-semibold">
            Dispatch history
          </h2>
          <p className="text-sm text-muted-foreground">
            Recorded dispatch creation, posting, and follow-up events.
          </p>
        </div>
        {dispatch.events.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No dispatch history has been recorded.
          </p>
        ) : (
          <ol
            aria-label="Dispatch history"
            className="divide-y rounded-lg border bg-card px-4"
          >
            {dispatch.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {event.event_type.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.actor_name}
                  </p>
                </div>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={event.created_at}
                >
                  {format(parseISO(event.created_at), "PPp")}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        aria-labelledby="branch-receipts-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="branch-receipts-heading" className="text-lg font-semibold">
            Branch receipts
          </h2>
          <p className="text-sm text-muted-foreground">
            Each record represents one receipt; partial receipts remain
            separate.
          </p>
        </div>
        {dispatch.receipts.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No branch receipts have been recorded.
          </p>
        ) : (
          <ol
            aria-label="Branch receipt history"
            className="divide-y rounded-lg border bg-card px-4"
          >
            {dispatch.receipts.map((receipt) => (
              <li key={receipt.id} className="flex flex-col gap-2 py-4">
                <p className="font-medium">
                  {receipt.receiver_name} ·{" "}
                  {format(parseISO(receipt.created_at), "PPp")}
                </p>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
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
        )}
      </section>

      <section
        aria-labelledby="shortage-closures-heading"
        className="flex flex-col gap-3"
      >
        <div>
          <h2 id="shortage-closures-heading" className="text-lg font-semibold">
            Shortage closures
          </h2>
          <p className="text-sm text-muted-foreground">
            Closed quantities are excluded from branch on-hand stock.
          </p>
        </div>
        {dispatch.shortage_closures.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No shortage closures have been recorded.
          </p>
        ) : (
          <ol
            aria-label="Shortage closure history"
            className="divide-y rounded-lg border bg-card px-4"
          >
            {dispatch.shortage_closures.map((closure) => (
              <li key={closure.id} className="flex flex-col gap-2 py-4">
                <p className="font-medium">
                  {closure.closer_name} ·{" "}
                  {format(parseISO(closure.created_at), "PPp")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {closure.reason}
                </p>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {closure.items.map((item) => (
                    <li key={item.closure_item_id}>
                      {item.stock_item_name}: {item.quantity_closed} {item.unit}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
