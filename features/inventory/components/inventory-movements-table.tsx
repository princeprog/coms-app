import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryMovementPage } from "../types/inventory.types";
import { cn } from "@/lib/utils";

const date = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
const time = new Intl.DateTimeFormat("en-PH", {
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
function movementLabel(value: string) {
  const label = value.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
function RecordedAt({ value }: { value: string }) {
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

export function InventoryMovementsTable({
  movements,
}: {
  movements: InventoryMovementPage;
}) {
  return (
    <Card
      aria-labelledby="inventory-movements-heading"
      className="min-w-0 gap-0 overflow-hidden py-0"
    >
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <CardTitle>
          <h3 id="inventory-movements-heading">Recent movements</h3>
        </CardTitle>
        <CardDescription>
          Latest stock changes for this location. Balance filters do not apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {movements.items.length > 0 ? (
          <Table
            aria-label="Recent movements"
            className="min-w-80"
            containerProps={{
              role: "region",
              "aria-label": "Recent inventory movements table",
              tabIndex: 0,
            }}
          >
            <TableCaption className="sr-only">
              Recent inventory changes, newest first. Signed quantities show
              additions and deductions in each item&apos;s unit. Times are in
              Philippine Standard Time (Asia/Manila).
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="pl-4 sm:pl-5">
                  Stock item
                </TableHead>
                <TableHead scope="col" className="hidden md:table-cell">
                  Movement
                </TableHead>
                <TableHead
                  scope="col"
                  className="pr-4 text-right sm:pr-5 lg:pr-2"
                >
                  Change
                </TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">
                  Recorded
                </TableHead>
                <TableHead
                  scope="col"
                  className="hidden pr-4 xl:table-cell sm:pr-5"
                >
                  Reason
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.items.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="max-w-72 py-3 pl-4 whitespace-normal sm:pl-5">
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium wrap-anywhere">
                        {movement.stock_item_name}
                      </span>
                      <span className="md:hidden">
                        <Badge
                          variant="secondary"
                          className="h-auto min-h-5 whitespace-normal"
                        >
                          {movementLabel(movement.movement_type)}
                        </Badge>
                      </span>
                      <div className="text-xs text-muted-foreground lg:hidden">
                        <RecordedAt value={movement.created_at} />
                      </div>
                      {movement.reason && (
                        <span className="text-xs text-muted-foreground wrap-anywhere xl:hidden">
                          {movement.reason}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden py-3 md:table-cell">
                    <Badge
                      variant="secondary"
                      className="h-auto min-h-5 whitespace-normal"
                    >
                      {movementLabel(movement.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "py-3 pr-4 text-right font-medium tabular-nums sm:pr-5 lg:pr-2",
                      movement.quantity_delta.startsWith("-") &&
                        "text-destructive",
                    )}
                  >
                    {movement.quantity_delta.startsWith("-")
                      ? movement.quantity_delta
                      : "+" + movement.quantity_delta}{" "}
                    {movement.unit}
                  </TableCell>
                  <TableCell className="hidden py-3 lg:table-cell">
                    <RecordedAt value={movement.created_at} />
                  </TableCell>
                  <TableCell className="hidden max-w-72 py-3 pr-4 whitespace-normal xl:table-cell sm:pr-5">
                    {movement.reason ?? (
                      <span className="text-muted-foreground">
                        Not provided
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-8 sm:px-5">
            <OperationalEmptyState
              title="No movement history yet"
              description="Receipts, transfers, sales, and adjustments will appear here."
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t px-4 py-3 text-sm text-muted-foreground sm:px-5">
        Showing {movements.items.length} of {movements.total}{" "}
        {movements.total === 1 ? "movement" : "movements"}
      </CardFooter>
    </Card>
  );
}
