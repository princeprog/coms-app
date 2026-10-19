import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dispatchCompletionSummary } from "../services/dispatch-completion-summary";
import type { Dispatch } from "../types/dispatch.types";
import { DispatchCompletedTable } from "./dispatch-completed-table";
import { DispatchDeliveryFacts } from "./dispatch-delivery-facts";

export function DispatchCompletedSummary({ dispatch }: { dispatch: Dispatch }) {
  const { notes, resolutions } = dispatchCompletionSummary(dispatch);
  return (
    <Card className="min-w-0 gap-0 rounded-2xl py-0 shadow-sm ring-foreground/10">
      <CardContent className="grid min-w-0 p-0 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <DispatchDeliveryFacts dispatch={dispatch} />
        <section
          aria-labelledby="dispatch-summary-heading"
          className="order-1 min-w-0 xl:order-2"
        >
          <CardHeader className="flex flex-row items-center gap-2.5 px-6 py-6 sm:px-7">
            <CardTitle>
              <h2
                id="dispatch-summary-heading"
                className="text-lg font-semibold"
              >
                Stock summary
              </h2>
            </CardTitle>
            <Badge
              variant="secondary"
              className="min-h-6 rounded-md text-sm tabular-nums transition-none"
              aria-label={`${dispatch.items.length} stock items`}
            >
              {dispatch.items.length}
            </Badge>
          </CardHeader>
          <DispatchCompletedTable
            dispatch={dispatch}
            resolutions={resolutions}
          />
          {notes.length > 0 && (
            <section
              aria-labelledby="delivery-notes-heading"
              className="flex flex-col gap-2 border-t px-6 py-5 sm:px-7"
            >
              <h3
                id="delivery-notes-heading"
                className="text-sm font-medium text-muted-foreground"
              >
                Delivery notes
              </h3>
              {notes.map((receipt) => (
                <p
                  key={receipt.id}
                  className="text-base whitespace-pre-wrap wrap-anywhere"
                >
                  {receipt.note}
                </p>
              ))}
            </section>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
