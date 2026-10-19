import { ArrowDown, ArrowUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import type {
  InventoryMovement,
  InventoryMovementPage,
} from "../types/inventory.types";
import { cn } from "@/lib/utils";

const RECENT_ACTIVITY_LIMIT = 5;
const activityDate = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});
const activityTime = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

function movementLabel(value: string) {
  if (value === "RECEIPT") return "Supplier receipt";
  const label = value.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function RecordedAt({ value }: { value: string }) {
  const instant = new Date(value);
  return (
    <time
      dateTime={value}
      className="whitespace-nowrap text-right tabular-nums"
      title={`${activityDate.format(instant)}, ${activityTime.format(instant)} PHT`}
    >
      <span className="block">{activityDate.format(instant)}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {activityTime.format(instant)}
      </span>
    </time>
  );
}

function ActivityRow({ movement }: { movement: InventoryMovement }) {
  const isDeduction = movement.quantity_delta.startsWith("-");
  const quantity = isDeduction
    ? movement.quantity_delta
    : `+${movement.quantity_delta}`;
  const Icon = isDeduction ? ArrowDown : ArrowUp;
  const label = movementLabel(movement.movement_type);
  const reason =
    movement.movement_type !== "RECEIPT" && movement.reason !== label
      ? movement.reason
      : null;
  return (
    <TableRow>
      <TableCell className="w-1/3 min-w-48 py-4 pl-4 font-medium whitespace-normal wrap-anywhere sm:pl-5">
        {movement.stock_item_name}
      </TableCell>
      <TableCell className="min-w-44 py-4 whitespace-normal">
        <span>{label}</span>
        {reason && (
          <p className="mt-1 max-w-sm text-xs text-muted-foreground wrap-anywhere">
            {reason}
          </p>
        )}
      </TableCell>
      <TableCell className="py-4 text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium tabular-nums",
            isDeduction
              ? "text-red-700 dark:text-red-300"
              : "text-emerald-700 dark:text-emerald-300",
          )}
        >
          <Icon aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="sr-only">
            {isDeduction ? "Stock deducted" : "Stock added"}
          </span>
          <span>
            {quantity} {movement.unit}
          </span>
        </span>
      </TableCell>
      <TableCell className="py-4 pr-4 text-right sm:pr-5">
        <RecordedAt value={movement.created_at} />
      </TableCell>
    </TableRow>
  );
}

export function InventoryMovementsTable({
  movements,
}: {
  movements: InventoryMovementPage;
}) {
  const recentMovements = movements.items.slice(0, RECENT_ACTIVITY_LIMIT);
  return (
    <Card
      aria-labelledby="inventory-movements-heading"
      className="min-w-0 gap-0 overflow-hidden py-0"
    >
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <CardTitle>
          <h3 id="inventory-movements-heading">Recent activity</h3>
        </CardTitle>
        <CardDescription className="sr-only">
          Latest changes for this location, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {recentMovements.length > 0 ? (
          <Table
            aria-label="Recent activity"
            className="min-w-2xl"
            containerProps={{
              role: "region",
              "aria-label": "Recent activity table",
              tabIndex: 0,
              className:
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            }}
          >
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4 sm:pl-5">Stock item</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Quantity change</TableHead>
                <TableHead className="pr-4 text-right sm:pr-5">
                  Recorded at
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.map((movement) => (
                <ActivityRow key={movement.id} movement={movement} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-8 sm:px-5">
            <OperationalEmptyState
              title="No activity yet"
              description="Receipts, transfers, sales, and adjustments will appear here."
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
        <span>Times shown in PHT</span>
        <span>
          Showing {recentMovements.length} of {movements.total}
        </span>
      </CardFooter>
    </Card>
  );
}
