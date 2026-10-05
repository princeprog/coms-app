import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  InventoryAdjustmentDialog,
  type InventoryAdjustmentAction,
} from "./inventory-adjustment-dialog";
import type { InventoryItem } from "../types/inventory.types";

function ItemStatus({ active }: { active: boolean }) {
  return (
    <Badge
      className={cn(
        "h-auto min-h-5 text-white",
        active ? "bg-emerald-700" : "bg-red-700",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function InventoryBalanceTable({
  items,
  scope,
  branchId,
  hasFilters,
  onClearFilters,
  canAdjust,
  adjustAction,
  onComplete,
}: {
  items: InventoryItem[];
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  canAdjust: boolean;
  adjustAction: InventoryAdjustmentAction;
  onComplete: (message: string) => void;
}) {
  const target =
    scope === "COMMISSARY"
      ? { scope: "COMMISSARY" as const }
      : { scope: "BRANCH" as const, branch_id: branchId ?? "" };
  if (items.length === 0)
    return (
      <div className="px-4 py-8 sm:px-5">
        <OperationalEmptyState
          title={
            hasFilters
              ? "No stock items match these filters."
              : "No stock items have been set up yet."
          }
          description={
            hasFilters
              ? "Change or clear the filters to see more stock items."
              : "Create a stock item to start tracking inventory at this location."
          }
          actions={
            hasFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      </div>
    );
  return (
    <Table
      aria-label="Stock balances"
      className="min-w-80"
      containerProps={{
        role: "region",
        "aria-label": "Stock balances table",
        tabIndex: 0,
      }}
    >
      <TableCaption className="sr-only">
        Stock balances for the selected location. Quantities retain their exact
        decimal precision and stock item units.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="pl-4 sm:pl-5">
            Stock item
          </TableHead>
          <TableHead scope="col" className="hidden lg:table-cell">
            Category
          </TableHead>
          <TableHead scope="col" className="text-right">
            On hand
          </TableHead>
          <TableHead scope="col" className="hidden md:table-cell">
            Unit
          </TableHead>
          <TableHead scope="col" className="hidden md:table-cell">
            Status
          </TableHead>
          {canAdjust && (
            <TableHead scope="col" className="w-12 pr-4 text-right sm:pr-5">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="max-w-72 py-3 pl-4 whitespace-normal sm:pl-5">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium wrap-anywhere">
                  {item.stock_item_name}
                </span>
                <span className="text-xs text-muted-foreground lg:hidden">
                  {item.category}
                </span>
                <span className="md:hidden">
                  <ItemStatus active={item.is_active} />
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden py-3 whitespace-normal lg:table-cell">
              {item.category}
            </TableCell>
            <TableCell className="py-3 text-right tabular-nums">
              <span className="hidden font-medium md:inline">
                {item.quantity_on_hand}
              </span>
              <span className="font-medium md:hidden">
                {item.quantity_on_hand} {item.unit}
              </span>
            </TableCell>
            <TableCell className="hidden py-3 md:table-cell">
              {item.unit}
            </TableCell>
            <TableCell className="hidden py-3 md:table-cell">
              <ItemStatus active={item.is_active} />
            </TableCell>
            {canAdjust && (
              <TableCell className="py-3 pr-4 text-right sm:pr-5">
                {item.is_active ? (
                  <InventoryAdjustmentDialog
                    item={item}
                    target={target}
                    action={adjustAction}
                    onComplete={onComplete}
                  />
                ) : (
                  <span className="text-muted-foreground">
                    <span aria-hidden="true">-</span>
                    <span className="sr-only">
                      Adjustment unavailable for inactive stock
                    </span>
                  </span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
