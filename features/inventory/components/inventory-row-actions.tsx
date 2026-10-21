"use client";

import { useRef, useState } from "react";
import { Ellipsis, Gauge, PackagePlus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SetStockLevelsAction } from "../services/stock-level-actions";
import type { InventoryItem } from "../types/inventory.types";
import {
  InventoryAdjustmentDialog,
  type InventoryAdjustmentAction,
  type InventoryAdjustmentTarget,
} from "./inventory-adjustment-dialog";
import {
  StockLevelsDialog,
  type StockLevelsLocation,
} from "./stock-levels-dialog";

export type InventoryLevelsControl = {
  action: SetStockLevelsAction;
  location: StockLevelsLocation;
};

/** One three-dot menu with every action this user has for the row. */
export function InventoryRowActions({
  item,
  target,
  adjustAction,
  canAdjust,
  levels,
  onRestock,
  onComplete,
}: {
  item: InventoryItem;
  target: InventoryAdjustmentTarget;
  adjustAction: InventoryAdjustmentAction;
  canAdjust: boolean;
  levels?: InventoryLevelsControl;
  onRestock?: (trigger: HTMLElement | null) => void;
  onComplete: (message: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<"adjust" | "levels" | null>(null);
  const showAdjust = canAdjust && item.is_active;
  const showLevels = Boolean(levels) && item.is_active;
  const showRestock = Boolean(onRestock) && item.is_active;
  const focusTrigger = () =>
    window.requestAnimationFrame(() => triggerRef.current?.focus());

  if (!showAdjust && !showLevels && !showRestock)
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">-</span>
        <span className="sr-only">No actions for this stock item</span>
      </span>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={"Actions for " + item.stock_item_name}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent data-coms-ui="operational" align="end">
          <DropdownMenuGroup>
            {showRestock && (
              <DropdownMenuItem onClick={() => onRestock?.(triggerRef.current)}>
                <PackagePlus aria-hidden="true" />
                Restock
              </DropdownMenuItem>
            )}
            {showAdjust && (
              <DropdownMenuItem onClick={() => setDialog("adjust")}>
                <SlidersHorizontal aria-hidden="true" />
                Adjust stock
              </DropdownMenuItem>
            )}
            {showLevels && (
              <DropdownMenuItem onClick={() => setDialog("levels")}>
                <Gauge aria-hidden="true" />
                Set levels
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {showAdjust && (
        <InventoryAdjustmentDialog
          item={item}
          target={target}
          action={adjustAction}
          open={dialog === "adjust"}
          onOpenChange={(open) => setDialog(open ? "adjust" : null)}
          onComplete={onComplete}
          onDiscarded={focusTrigger}
        />
      )}
      {showLevels && levels && dialog === "levels" && (
        <StockLevelsDialog
          item={item}
          location={levels.location}
          action={levels.action}
          open
          onOpenChange={(open) => {
            setDialog(open ? "levels" : null);
            if (!open) focusTrigger();
          }}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
