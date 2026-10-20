import { ReceivingStatusBadge } from "./receiving-status-badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DispatchPage } from "../types/dispatch.types";
import { DispatchRowActions } from "./dispatch-row-actions";
import { DispatchStatusBadge } from "./dispatch-status-badge";
const date = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
const time = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
function DispatchTimestamp({ value }: { value: string }) {
  const instant = new Date(value);
  return (
    <time
      dateTime={value}
      className="flex flex-col gap-1 whitespace-nowrap tabular-nums"
    >
      <span>{date.format(instant)}</span>
      <span className="text-xs text-muted-foreground">
        {time.format(instant)} PHT
      </span>
    </time>
  );
}
export function DispatchTable({ page }: { page: DispatchPage }) {
  return (
    <Table
      aria-label="Dispatches"
      containerProps={{
        role: "region",
        "aria-label": "Dispatches table",
        tabIndex: 0,
      }}
    >
      <TableCaption className="sr-only">
        Dispatches and estimated arrival times. Stock item counts represent
        distinct lines, not total units. All times are Philippine Standard Time.
      </TableCaption>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col" className="pl-4 sm:pl-5">
            Branch
          </TableHead>
          <TableHead scope="col" className="hidden text-right sm:table-cell">
            Stock items
          </TableHead>
          <TableHead scope="col" className="sm:pl-8">
            Status
          </TableHead>
          <TableHead scope="col" className="hidden lg:table-cell">
            Dispatched
          </TableHead>
          <TableHead scope="col" className="hidden md:table-cell">
            Estimated arrival
          </TableHead>
          <TableHead scope="col" className="w-12 pr-4 sm:pr-5">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.items.map((dispatch) => {
          const receiving = ["AWAITING_COUNT", "OVERDUE", "REVIEW"].includes(
            dispatch.receiving_status ?? "",
          );
          const due = receiving ? dispatch.receive_by : null;
          return (
            <TableRow key={dispatch.id}>
              <TableCell className="max-w-72 py-4 pl-4 whitespace-normal sm:pl-5">
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium wrap-anywhere">
                    {dispatch.branch_name}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {dispatch.item_count} stock{" "}
                    {dispatch.item_count === 1 ? "item" : "items"}
                  </span>
                  <div className="text-xs text-muted-foreground lg:hidden">
                    {due ? (
                      <span className="md:hidden">
                        Due <DispatchTimestamp value={due} />
                      </span>
                    ) : dispatch.dispatched_at ? (
                      <DispatchTimestamp value={dispatch.dispatched_at} />
                    ) : (
                      "Not dispatched"
                    )}
                    {due && dispatch.dispatched_at && (
                      <span className="hidden md:block">
                        <DispatchTimestamp value={dispatch.dispatched_at} />
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden py-4 text-right tabular-nums sm:table-cell">
                {dispatch.item_count}
              </TableCell>
              <TableCell className="py-4 whitespace-normal sm:pl-8">
                {receiving ? (
                  <ReceivingStatusBadge status={dispatch.receiving_status} />
                ) : (
                  <DispatchStatusBadge status={dispatch.status} />
                )}
              </TableCell>
              <TableCell className="hidden py-4 lg:table-cell">
                {dispatch.dispatched_at ? (
                  <DispatchTimestamp value={dispatch.dispatched_at} />
                ) : (
                  <span className="text-muted-foreground">Not dispatched</span>
                )}
              </TableCell>
              <TableCell className="hidden py-4 md:table-cell">
                {due ? (
                  <DispatchTimestamp value={due} />
                ) : (
                  <span
                    className="text-muted-foreground"
                    aria-label="No pending arrival estimate"
                  >
                    &mdash;
                  </span>
                )}
              </TableCell>
              <TableCell className="py-4 pr-4 text-right sm:pr-5">
                <DispatchRowActions
                  id={dispatch.id}
                  branchName={dispatch.branch_name}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
