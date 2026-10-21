import { stockUnitLabel } from "../stock-unit-label";
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
import {
  InventoryAdjustmentDialog,
  type InventoryAdjustmentAction,
} from "./inventory-adjustment-dialog";
import type { InventoryItem } from "../types/inventory.types";
import { useRestock } from "@/features/direct-purchases/components/restock-provider";
import {
  RestockRowMenu,
  purchaseStockFromBalance,
} from "@/features/direct-purchases/components/restock-row-menu";

const updatedAt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});
const ZERO_QUANTITY_PATTERN = /^0(?:\.0+)?$/;

function isZeroQuantity(value: string) {
  return ZERO_QUANTITY_PATTERN.test(value);
}

// Recipe deductions never block a sale, so branch stock can run below zero
// until a physical count corrects it.
function isBelowZero(value: string) {
  return value.startsWith("-") && !isZeroQuantity(value.slice(1));
}

function StockHealth({ item }: { item: InventoryItem }) {
  if (!item.is_active) {
    return (
      <Badge className="h-auto min-h-6 bg-red-700 text-white">Inactive</Badge>
    );
  }
  if (isBelowZero(item.quantity_on_hand)) {
    return (
      <Badge className="h-auto min-h-6 bg-red-700 text-white">Below zero</Badge>
    );
  }
  if (isZeroQuantity(item.quantity_on_hand)) {
    return (
      <Badge className="h-auto min-h-6 bg-red-700 text-white">
        Out of stock
      </Badge>
    );
  }
  return (
    <Badge className="h-auto min-h-6 bg-emerald-700 text-white">In stock</Badge>
  );
}

function UpdatedAt({ value }: { value: string }) {
  const instant = new Date(value);
  const label = updatedAt.format(instant);
  return (
    <time dateTime={value} title={`${label} PHT`}>
      {label}
    </time>
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
  const restock = useRestock();
  const canRestock = scope === "COMMISSARY" && restock !== null;
  const showActions = canAdjust || canRestock;
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
      className="min-w-2xl"
      containerProps={{
        role: "region",
        "aria-label": "Stock balances table",
        tabIndex: 0,
      }}
    >
      <TableCaption className="sr-only">
        Stock balances for the selected location. Quantities retain their exact
        decimal precision and stock item units. Updated times are shown in
        Philippine Standard Time.
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
            Available stock
          </TableHead>
          <TableHead scope="col" className="pl-6 sm:pl-8">
            Units
          </TableHead>
          <TableHead scope="col" className="pl-6 whitespace-nowrap sm:pl-8">
            Status
          </TableHead>
          <TableHead scope="col" className="hidden xl:table-cell">
            Updated
          </TableHead>
          {showActions && (
            <TableHead scope="col" className="w-12 pr-4 text-right sm:pr-5">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="min-w-48 max-w-72 py-3 pl-4 whitespace-normal sm:pl-5">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium wrap-anywhere">
                  {item.stock_item_name}
                </span>
                <span className="text-xs text-muted-foreground lg:hidden">
                  {item.category}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden py-3 whitespace-normal lg:table-cell">
              {item.category}
            </TableCell>
            <TableCell className="py-3 text-right tabular-nums">
              <span
                className={
                  isBelowZero(item.quantity_on_hand)
                    ? "font-medium text-destructive"
                    : "font-medium"
                }
              >
                {item.quantity_on_hand}
              </span>
            </TableCell>
            <TableCell className="py-3 pl-6 sm:pl-8">
              {stockUnitLabel(item.unit)}
            </TableCell>
            <TableCell className="py-3 pl-6 sm:pl-8">
              <StockHealth item={item} />
            </TableCell>
            <TableCell className="hidden py-3 text-muted-foreground xl:table-cell">
              <UpdatedAt value={item.updated_at} />
            </TableCell>
            {showActions && (
              <TableCell className="py-3 pr-4 text-right sm:pr-5">
                {item.is_active && canAdjust ? (
                  <InventoryAdjustmentDialog
                    item={item}
                    target={target}
                    action={adjustAction}
                    onComplete={onComplete}
                    onRestock={
                      canRestock
                        ? (trigger) =>
                            restock.openRestock(
                              purchaseStockFromBalance(item),
                              trigger,
                            )
                        : undefined
                    }
                  />
                ) : item.is_active ? (
                  <RestockRowMenu stock={purchaseStockFromBalance(item)} />
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
