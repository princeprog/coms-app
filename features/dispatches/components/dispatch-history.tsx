import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dispatch } from "@/features/dispatches/types/dispatch.types";

export function DispatchHistory({ dispatch }: { dispatch: Dispatch }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dispatch history</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatch.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dispatch history has been recorded.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {dispatch.events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 border-l-2 pl-4 sm:flex-row sm:items-center sm:justify-between"
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Branch receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatch.receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No branch receipts have been recorded.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {dispatch.receipts.map((receipt) => (
                <li key={receipt.id} className="flex flex-col gap-1">
                  <p className="font-medium">
                    {receipt.receiver_name} ·{" "}
                    {format(parseISO(receipt.created_at), "PPp")}
                  </p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Shortage closures</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatch.shortage_closures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shortage closures have been recorded.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {dispatch.shortage_closures.map((closure) => (
                <li key={closure.id} className="flex flex-col gap-1">
                  <p className="font-medium">{closure.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    Closed by {closure.closer_name} ·{" "}
                    {format(parseISO(closure.created_at), "PPp")}
                  </p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {closure.items.map((item) => (
                      <li key={item.closure_item_id}>
                        {item.stock_item_name}: {item.quantity_closed}{" "}
                        {item.unit}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
