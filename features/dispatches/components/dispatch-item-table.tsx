import { Fragment } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Dispatch } from "../types/dispatch.types";
import { receivedPercentage } from "../services/dispatch-detail-presentation";

export function DispatchItemTable({ dispatch }: { dispatch: Dispatch }) {
  const draft = dispatch.status === "DRAFT";
  return (
    <Table
      aria-label="Dispatch items"
      containerProps={{
        role: "region",
        "aria-label": "Dispatch quantities table",
        tabIndex: 0,
        className:
          "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
      }}
    >
      <TableCaption className="sr-only">
        Exact stock quantities by unit. Receipt progress excludes closed
        shortages.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Stock item</TableHead>
          <TableHead scope="col" className="hidden sm:table-cell">
            Unit
          </TableHead>
          <TableHead
            scope="col"
            className={cn("text-right", !draft && "hidden sm:table-cell")}
          >
            {draft ? "Planned quantity" : "Dispatched"}
          </TableHead>
          {!draft && (
            <>
              <TableHead scope="col" className="text-right">
                Received
              </TableHead>
              <TableHead
                scope="col"
                className="hidden text-right whitespace-normal sm:table-cell"
              >
                Shortage closed
              </TableHead>
              <TableHead scope="col" className="text-right">
                In transit
              </TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispatch.items.map((item) => {
          const percent = receivedPercentage(
            item.quantity_received,
            item.quantity_dispatched,
          );
          return (
            <Fragment key={item.id}>
              <TableRow className={cn(!draft && "border-0")}>
                <TableCell className="min-w-28 max-w-40 py-3 align-top whitespace-normal">
                  <span className="font-medium wrap-anywhere">
                    {item.stock_item_name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                    {item.unit}
                  </span>
                  {!draft && (
                    <dl className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:hidden">
                      <div>
                        <dt className="inline">Dispatched: </dt>
                        <dd className="inline tabular-nums">
                          {item.quantity_dispatched}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline">Shortage closed: </dt>
                        <dd className="inline tabular-nums">
                          {item.quantity_shortage_closed}
                        </dd>
                      </div>
                    </dl>
                  )}
                </TableCell>
                <TableCell className="hidden py-3 align-top text-muted-foreground sm:table-cell">
                  {item.unit}
                </TableCell>
                <TableCell
                  className={cn(
                    "py-3 text-right align-top tabular-nums",
                    !draft && "hidden sm:table-cell",
                  )}
                >
                  {item.quantity_dispatched}
                </TableCell>
                {!draft && (
                  <>
                    <TableCell className="py-3 text-right align-top tabular-nums">
                      {item.quantity_received}
                    </TableCell>
                    <TableCell className="hidden py-3 text-right align-top tabular-nums sm:table-cell">
                      {item.quantity_shortage_closed}
                    </TableCell>
                    <TableCell className="py-3 text-right align-top font-medium tabular-nums">
                      {item.quantity_in_transit}
                    </TableCell>
                  </>
                )}
              </TableRow>
              {!draft && (
                <TableRow>
                  <TableCell colSpan={6} className="pt-0 pb-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                      <Progress
                        value={percent}
                        aria-label={`${item.stock_item_name} received`}
                        className={cn(
                          "min-w-16 flex-1 [&_[data-slot=progress-track]]:h-2",
                          percent === 100 &&
                            "[&_[data-slot=progress-indicator]]:bg-emerald-700",
                        )}
                      />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {percent}% received
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
        {dispatch.items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={draft ? 3 : 6}
              className="py-6 text-center text-muted-foreground"
            >
              This dispatch has no item lines.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
