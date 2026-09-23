import { Card, CardContent } from "@/components/ui/card";
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stock item</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.items.map((movement) => (
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
                <TableCell className="tabular-nums">
                  {movement.quantity_delta.startsWith("-")
                    ? movement.quantity_delta
                    : `+${movement.quantity_delta}`}{" "}
                  {movement.unit}
                </TableCell>
                <TableCell className="max-w-64 whitespace-normal">
                  {movement.reason ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">No movement history yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Receipts, transfers, sales, and adjustments will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
