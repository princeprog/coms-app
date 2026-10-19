import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import {
  completedDifference,
  dispatchCompletionSummary,
} from "../services/dispatch-completion-summary";
import type { Dispatch } from "../types/dispatch.types";

export function DispatchCompletedTable({
  dispatch,
  resolutions,
}: {
  dispatch: Dispatch;
  resolutions: ReturnType<typeof dispatchCompletionSummary>["resolutions"];
}) {
  const withDiscrepancies = dispatch.status === "CLOSED_WITH_SHORTAGE";
  return (
    <Table
      aria-label="Dispatch items"
      className={withDiscrepancies ? "min-w-3xl text-base" : "w-full text-base"}
      containerProps={{
        role: "region",
        "aria-label": "Completed dispatch quantities",
        tabIndex: 0,
        className:
          "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      }}
    >
      <TableHeader className="bg-muted [&_th]:h-12 [&_th]:text-sm [&_th]:font-medium [&_th]:text-muted-foreground">
        <TableRow>
          <TableHead
            scope="col"
            className="sticky left-0 z-10 bg-muted pl-6 sm:pl-7"
          >
            Stock item
          </TableHead>
          <TableHead scope="col" className="text-right">
            Sent
          </TableHead>
          <TableHead scope="col" className="pr-6 sm:pr-7 text-right">
            Received
          </TableHead>
          {withDiscrepancies && (
            <>
              <TableHead scope="col">Difference</TableHead>
              <TableHead scope="col" className="pr-6 sm:pr-7">
                Resolution
              </TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dispatch.items.map((item) => {
          const entries = resolutions.get(item.id) ?? [];
          return (
            <TableRow key={item.id} className="hover:bg-transparent">
              <TableCell className="sticky left-0 z-10 min-w-36 max-w-52 bg-card py-6 pl-6 align-top font-medium whitespace-normal wrap-anywhere sm:pl-7">
                {item.stock_item_name}
              </TableCell>
              <TableCell className="py-6 text-right align-top tabular-nums">
                {item.quantity_dispatched == null
                  ? "Not recorded"
                  : `${item.quantity_dispatched} ${item.unit}`}
              </TableCell>
              <TableCell className="py-6 pr-6 text-right align-top font-medium tabular-nums sm:pr-7">
                {item.quantity_received} {item.unit}
              </TableCell>
              {withDiscrepancies && (
                <>
                  <TableCell className="py-6 align-top text-muted-foreground tabular-nums">
                    {completedDifference(item.quantity_variance, item.unit)}
                  </TableCell>
                  <TableCell className="min-w-48 max-w-72 py-6 pr-6 align-top whitespace-normal sm:pr-7">
                    {entries.length > 0 ? (
                      <ul
                        className="flex flex-col gap-3"
                        aria-label={`Resolutions for ${item.stock_item_name}`}
                      >
                        {entries.map((entry) => (
                          <li key={entry.id} className="flex flex-col gap-1">
                            <span className="font-medium">
                              {entry.outcome}{" "}
                              <span className="font-normal text-muted-foreground">
                                · {entry.quantity} {item.unit}
                              </span>
                            </span>
                            <details className="group/reason">
                              <summary
                                aria-label={`Reason for ${item.stock_item_name}: ${entry.outcome}, ${entry.quantity} ${item.unit}`}
                                className="dispatch-press -ml-1 flex min-h-9 w-fit cursor-pointer list-none items-center gap-1 rounded-md px-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
                              >
                                <ChevronRight
                                  aria-hidden="true"
                                  className="size-3.5 group-open/reason:rotate-90"
                                />
                                Reason
                              </summary>
                              <p className="pt-2 text-sm text-muted-foreground whitespace-pre-wrap wrap-anywhere">
                                {entry.reason}
                              </p>
                            </details>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">
                        {item.quantity_variance != null &&
                        !/[1-9]/.test(item.quantity_variance)
                          ? "No discrepancy"
                          : "Not recorded"}
                      </span>
                    )}
                  </TableCell>
                </>
              )}
            </TableRow>
          );
        })}
        {dispatch.items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={withDiscrepancies ? 5 : 3}
              className="py-8 text-center text-muted-foreground"
            >
              No stock items.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
