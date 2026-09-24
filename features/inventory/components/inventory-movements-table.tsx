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

export function InventoryMovementsTable({
  movements,
}: {
  movements: InventoryMovementPage;
}) {
  return (
    <section
      aria-labelledby="inventory-movements-heading"
      className="flex flex-col gap-3"
    >
      <div>
        <h2 id="inventory-movements-heading" className="text-lg font-semibold">
          Recent movements
        </h2>
        <p className="text-sm text-muted-foreground">
          Stock changes are recorded in the inventory ledger.
        </p>
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
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stock item</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.items.map((movement) => {
              const quantity = movement.quantity_delta.startsWith("-")
                ? movement.quantity_delta
                : "+" + movement.quantity_delta;
              return (
                <TableRow key={movement.id}>
                  <TableCell>
                    <time dateTime={movement.created_at}>
                      {displayTimestamp(movement.created_at)}
                    </time>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.stock_item_name}
                  </TableCell>
                  <TableCell>
                    {displayMovementType(movement.movement_type)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {quantity} {movement.unit}
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
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
