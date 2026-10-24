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
import type { InventoryAdjustmentAction } from "./inventory-adjustment-dialog";
import {
  InventoryRowActions,
  type InventoryLevelsControl,
} from "./inventory-row-actions";
import type { InventoryItem, StockStatus } from "../types/inventory.types";
import { isZeroQuantity, restockQuantity } from "../services/stock-levels";
import { useRestock } from "@/features/direct-purchases/components/restock-provider";
import { purchaseStockFromBalance } from "@/features/direct-purchases/services/purchase-stock";

const updatedAt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});
// Solid badges with white text; each shade keeps AA contrast in both themes.
const STATUS_BADGE: Record<StockStatus, { label: string; className: string }> =
  {
    INACTIVE: { label: "Inactive", className: "bg-red-700" },
    BELOW_ZERO: { label: "Below zero", className: "bg-red-700" },
    OUT_OF_STOCK: { label: "Out of stock", className: "bg-red-700" },
    LOW: { label: "Low stock", className: "bg-amber-700" },
    RESTOCKING: { label: "Restocking", className: "bg-sky-700" },
    IN_STOCK: { label: "In stock", className: "bg-emerald-700" },
  };

function StockHealth({ item }: { item: InventoryItem }) {
  const badge = STATUS_BADGE[item.stock_status];
  return (
    <Badge className={"h-auto min-h-6 text-white " + badge.className}>
      {badge.label}
    </Badge>
  );
}

function StockLevels({ item }: { item: InventoryItem }) {
  if (item.reorder_level === null || item.target_level === null)
    return <span className="text-muted-foreground">Not set</span>;
  return (
    <span className="flex flex-col tabular-nums">
      <span>Reorder at {item.reorder_level}</span>
      <span className="text-xs text-muted-foreground">
        Target {item.target_level}
      </span>
    </span>
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
  levels,
  onComplete,
}: {
  items: InventoryItem[];
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  hasFilters: boolean;
  onClearFilters: () => void;
  canAdjust: boolean;
  adjustAction: InventoryAdjustmentAction;
  /** Present when the user may set reorder and target levels here. */
  levels?: InventoryLevelsControl;
  onComplete: (message: string) => void;
}) {
  const restock = useRestock();
  const canRestock = scope === "COMMISSARY" && restock !== null;
  const showActions = canAdjust || canRestock || Boolean(levels);
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
          <TableHead scope="col" className="hidden md:table-cell">
            Levels
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
              <span className="flex flex-col items-end">
                <span
                  className={
                    item.stock_status === "BELOW_ZERO"
                      ? "font-medium text-destructive"
                      : "font-medium"
                  }
                >
                  {item.quantity_on_hand}
                </span>
                {!isZeroQuantity(item.on_the_way) && (
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    +{item.on_the_way} on the way
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell className="py-3 pl-6 sm:pl-8">{item.unit}</TableCell>
            <TableCell className="py-3 pl-6 sm:pl-8">
              <StockHealth item={item} />
            </TableCell>
            <TableCell className="hidden py-3 md:table-cell">
              <StockLevels item={item} />
            </TableCell>
            <TableCell className="hidden py-3 text-muted-foreground xl:table-cell">
              <UpdatedAt value={item.updated_at} />
            </TableCell>
            {showActions && (
              <TableCell className="py-3 pr-4 text-right sm:pr-5">
                <InventoryRowActions
                  item={item}
                  target={target}
                  adjustAction={adjustAction}
                  canAdjust={canAdjust}
                  levels={levels}
                  onComplete={onComplete}
                  onRestock={
                    canRestock
                      ? (trigger) =>
                          restock.openRestock(
                            {
                              ...purchaseStockFromBalance(item),
                              suggested_quantity:
                                restockQuantity(item) ?? undefined,
                            },
                            trigger,
                          )
                      : undefined
                  }
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
