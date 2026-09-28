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
  total,
  scope,
  branchId,
  search,
  canAdjust,
  adjustAction,
  onComplete,
  compact = false,
}: {
  items: InventoryItem[];
  total: number;
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  search: string;
  canAdjust: boolean;
  adjustAction: InventoryAdjustmentAction;
  onComplete: (message: string) => void;
  compact?: boolean;
}) {
  const target =
    scope === "COMMISSARY"
      ? { scope: "COMMISSARY" as const }
      : { scope: "BRANCH" as const, branch_id: branchId ?? "" };

  return (
    <section
      aria-labelledby="stock-balances-heading"
      className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="stock-balances-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Stock balances
          </h2>
          <p className="text-sm text-muted-foreground">
            Quantities are shown in each stock item&apos;s unit.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {compact
            ? `${total} ${total === 1 ? "item" : "items"}`
            : `${items.length} shown`}
        </p>
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
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className={compact ? "h-9" : "h-10"}>
                Stock item
              </TableHead>
              <TableHead className={compact ? "h-9" : "h-10"}>
                Category
              </TableHead>
              <TableHead className={`${compact ? "h-9" : "h-10"} text-right`}>
                On hand
              </TableHead>
              {compact && <TableHead className="h-9">Unit</TableHead>}
              <TableHead className={compact ? "h-9" : "h-10"}>Status</TableHead>
              {canAdjust && (
                <TableHead className={`${compact ? "h-9" : "h-10"} text-right`}>
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell
                  className={`${compact ? "py-1" : "py-2.5"} font-medium`}
                >
                  {item.stock_item_name}
                </TableCell>
                <TableCell className={compact ? "py-1" : "py-2.5"}>
                  {item.category}
                </TableCell>
                <TableCell
                  className={`${compact ? "py-1" : "py-2.5"} text-right tabular-nums`}
                >
                  {item.quantity_on_hand}
                  {!compact && ` ${item.unit}`}
                </TableCell>
                {compact && <TableCell className="py-1">{item.unit}</TableCell>}
                <TableCell className={compact ? "py-1" : "py-2.5"}>
                  <Badge
                    className={
                      item.is_active
                        ? "rounded-full bg-green-700 px-3 text-white dark:bg-green-700"
                        : "rounded-full bg-red-700 px-3 text-white dark:bg-red-700"
                    }
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canAdjust && (
                  <TableCell
                    className={`${compact ? "py-1" : "py-2.5"} text-right`}
                  >
                    {item.is_active ? (
                      <InventoryAdjustmentDialog
                        item={item}
                        target={target}
                        action={adjustAction}
                        onComplete={onComplete}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Adjustment unavailable
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
