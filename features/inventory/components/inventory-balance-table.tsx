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
import { InventoryAdjustmentDialog } from "@/features/inventory/components/inventory-adjustment-dialog";
import type { InventoryAdjustmentAction } from "@/features/inventory/components/inventory-adjustment-dialog";
import type { InventoryItem } from "@/features/inventory/types/inventory.types";

export function InventoryBalanceTable({
  items,
  scope,
  branchId,
  search,
  canAdjust,
  adjustAction,
  onComplete,
}: {
  items: InventoryItem[];
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  search: string;
  canAdjust: boolean;
  adjustAction: InventoryAdjustmentAction;
  onComplete: (message: string) => void;
}) {
  const target =
    scope === "COMMISSARY"
      ? { scope: "COMMISSARY" as const }
      : { scope: "BRANCH" as const, branch_id: branchId ?? "" };

  return (
    <section
      aria-labelledby="stock-balances-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="stock-balances-heading" className="text-lg font-semibold">
            Stock balances
          </h2>
          <p className="text-sm text-muted-foreground">
            Quantities are shown in each stock item&apos;s unit.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{items.length} shown</p>
      </div>

      {items.length === 0 ? (
        <OperationalEmptyState
          title={
            search.trim()
              ? "No stock items match this search."
              : "No stock items have been set up yet."
          }
          description={
            search.trim()
              ? "Change or clear the search term to see other stock balances."
              : "A catalog manager can add stock items before inventory is tracked."
          }
        />
      ) : (
        <Table
          containerProps={{
            role: "region",
            "aria-label": "Stock balances table",
            tabIndex: 0,
            className:
              "rounded-lg border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Stock item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.stock_item_name}
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity_on_hand} {item.unit}
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "secondary" : "outline"}>
                    {item.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canAdjust && item.is_active ? (
                    <InventoryAdjustmentDialog
                      item={item}
                      target={target}
                      action={adjustAction}
                      onComplete={onComplete}
                    />
                  ) : !item.is_active ? (
                    <span className="text-sm text-muted-foreground">
                      Inactive items cannot be adjusted
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
