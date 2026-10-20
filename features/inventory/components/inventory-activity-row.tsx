import { ArrowDown, ArrowUp } from "lucide-react";
import { PurchaseRowActions } from "@/features/direct-purchases/components/purchase-row-actions";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InventoryMovement } from "../types/inventory.types";
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

export function ActivityRow({
  movement,
  canReadPurchases,
}: {
  movement: InventoryMovement;
  canReadPurchases: boolean;
}) {
  const isDeduction = movement.quantity_delta.startsWith("-");
  const quantity = isDeduction
    ? movement.quantity_delta
    : `+${movement.quantity_delta}`;
  const Icon = isDeduction ? ArrowDown : ArrowUp;
  const label =
    movement.receipt_kind === "DIRECT_PURCHASE"
      ? "Purchase received"
      : movementLabel(movement.movement_type);
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
      {canReadPurchases && (
        <TableCell className="pr-4 text-right">
          {" "}
          {canReadPurchases &&
            movement.receipt_kind === "DIRECT_PURCHASE" &&
            movement.receipt_id && (
              <PurchaseRowActions
                href={`/inventory/purchases?purchase_id=${movement.receipt_id}`}
                label="purchase"
              />
            )}{" "}
        </TableCell>
      )}
    </TableRow>
  );
}
