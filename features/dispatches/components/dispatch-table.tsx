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
    <time dateTime={value} className="flex flex-wrap gap-x-1 lg:flex-col">
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
      className="min-w-80"
      containerProps={{
        role: "region",
        "aria-label": "Dispatches table",
        tabIndex: 0,
      }}
    >
      <TableCaption className="sr-only">
        Branch deliveries. Stock item counts represent distinct delivery lines,
        not total units. All times are in Philippine Standard Time
        (Asia/Manila).
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="pl-4 sm:pl-5">
            Branch
          </TableHead>
          <TableHead scope="col" className="hidden text-right sm:table-cell">
            Stock items
          </TableHead>
          <TableHead scope="col">Delivery status</TableHead>
          <TableHead scope="col" className="hidden md:table-cell">
            Discrepancy
          </TableHead>
          <TableHead scope="col" className="hidden lg:table-cell">
            Dispatched
          </TableHead>
          <TableHead scope="col" className="w-12 pr-4 text-right sm:pr-5">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.items.map((dispatch) => (
          <TableRow key={dispatch.id}>
            <TableCell className="max-w-72 py-4 pl-4 whitespace-normal sm:pl-5">
              <div className="flex flex-col gap-1">
                <span className="font-medium wrap-anywhere">
                  {dispatch.branch_name}
                </span>
                <span className="text-xs text-muted-foreground sm:hidden">
                  {dispatch.item_count} stock{" "}
                  {dispatch.item_count === 1 ? "item" : "items"}
                </span>
                <span className="hidden text-xs text-muted-foreground lg:block">
                  Created{" "}
                  <time
                    dateTime={dispatch.created_at}
                    title={`${date.format(new Date(dispatch.created_at))}, ${time.format(new Date(dispatch.created_at))} PHT`}
                  >
                    {date.format(new Date(dispatch.created_at))}
                    {" · "}
                    {time.format(new Date(dispatch.created_at))}
                  </time>
                </span>
                <div className="text-xs text-muted-foreground lg:hidden">
                  {dispatch.dispatched_at ? (
                    <DispatchTimestamp value={dispatch.dispatched_at} />
                  ) : (
                    "Not dispatched"
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden py-4 text-right tabular-nums sm:table-cell">
              <span className="font-medium">{dispatch.item_count}</span>
            </TableCell>
            <TableCell className="py-4 whitespace-normal">
              <div className="flex flex-col items-start gap-2">
                <DispatchStatusBadge status={dispatch.status} />
                {dispatch.discrepancy_status && (
                  <div className="flex flex-col items-start gap-1 md:hidden">
                    <span className="text-xs text-muted-foreground">
                      Discrepancy
                    </span>
                    <DispatchStatusBadge status={dispatch.discrepancy_status} />
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden py-4 whitespace-normal md:table-cell">
              {dispatch.discrepancy_status ? (
                <DispatchStatusBadge status={dispatch.discrepancy_status} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not reported
                </span>
              )}
            </TableCell>
            <TableCell className="hidden py-4 lg:table-cell">
              {dispatch.dispatched_at ? (
                <DispatchTimestamp value={dispatch.dispatched_at} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not dispatched
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
        ))}
      </TableBody>
    </Table>
  );
}
