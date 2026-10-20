import { ActivityRow } from "./inventory-activity-row";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import type { InventoryMovementPage } from "../types/inventory.types";

const RECENT_ACTIVITY_LIMIT = 5;
export function InventoryMovementsTable({
  movements,
  canReadPurchases = false,
}: {
  movements: InventoryMovementPage;
  canReadPurchases?: boolean;
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
                {canReadPurchases && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.map((movement) => (
                <ActivityRow
                  key={movement.id}
                  movement={movement}
                  canReadPurchases={canReadPurchases}
                />
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
