import { Badge } from "@/components/ui/badge";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryMovementPage } from "@/features/inventory/types/inventory.types";

function displayMovementType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function displayTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function movementBadgeClass(type: string) {
  if (type === "RECEIPT" || type === "TRANSFER_IN") {
    return "rounded-md bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100";
  }
  if (type === "SALE" || type === "SALE_VOID") {
    return "rounded-md bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100";
  }
  if (type === "DISPATCH") {
    return "rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100";
  }
  return "rounded-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
}

export function InventoryMovementsTable({
  movements,
  compact = false,
}: {
  movements: InventoryMovementPage;
  compact?: boolean;
}) {
  return (
    <section
      aria-labelledby="inventory-movements-heading"
      className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="inventory-movements-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Recent movements
          </h2>
          <p className="text-sm text-muted-foreground">
            Stock changes are recorded in the inventory ledger.
          </p>
        </div>
        {compact && (
          <p className="text-sm text-muted-foreground">
            {movements.items.length} recent
          </p>
        )}
      </div>
      {movements.items.length > 0 ? (
        <Table
          containerProps={{
            role: "region",
            "aria-label": "Recent inventory movements table",
            tabIndex: 0,
            className:
              "rounded-lg border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          }}
        >
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className={compact ? "h-9" : "h-10"}>Date</TableHead>
              <TableHead className={compact ? "h-9" : "h-10"}>
                Stock item
              </TableHead>
              <TableHead className={compact ? "h-9" : "h-10"}>
                Movement
              </TableHead>
              <TableHead className={`${compact ? "h-9" : "h-10"} text-right`}>
                Change
              </TableHead>
              <TableHead className={compact ? "h-9" : "h-10"}>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.items.map((movement) => {
              const quantity = movement.quantity_delta.startsWith("-")
                ? movement.quantity_delta
                : "+" + movement.quantity_delta;
              return (
                <TableRow key={movement.id}>
                  <TableCell className={compact ? "py-1" : "py-2.5"}>
                    <time dateTime={movement.created_at}>
                      {displayTimestamp(movement.created_at)}
                    </time>
                  </TableCell>
                  <TableCell
                    className={`${compact ? "py-1" : "py-2.5"} font-medium`}
                  >
                    {movement.stock_item_name}
                  </TableCell>
                  <TableCell className={compact ? "py-1" : "py-2.5"}>
                    {compact ? (
                      <Badge
                        variant="secondary"
                        className={movementBadgeClass(movement.movement_type)}
                      >
                        {displayMovementType(movement.movement_type)}
                      </Badge>
                    ) : (
                      displayMovementType(movement.movement_type)
                    )}
                  </TableCell>
                  <TableCell
                    className={`${compact ? "py-1" : "py-2.5"} text-right tabular-nums ${compact ? (quantity.startsWith("-") ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400") : ""}`}
                  >
                    {quantity} {movement.unit}
                  </TableCell>
                  <TableCell
                    className={`max-w-64 whitespace-normal ${compact ? "py-1" : "py-2.5"}`}
                  >
                    {movement.reason ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <OperationalEmptyState
          title="No movement history yet"
          description="Receipts, transfers, sales, and adjustments will appear here."
        />
      )}
    </section>
  );
}
