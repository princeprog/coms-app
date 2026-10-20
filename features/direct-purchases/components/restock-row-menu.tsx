"use client";
import { useRef } from "react";
import { Ellipsis, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PurchaseStock } from "../schemas/purchase.schema";
import { useRestock } from "./restock-provider";

export function purchaseStockFromBalance(item: {
  id: string;
  stock_item_name: string;
  unit: string;
  is_active: boolean;
  quantity_on_hand: string;
}): PurchaseStock {
  return {
    id: item.id,
    stock_item_name: item.stock_item_name,
    unit: item.unit,
    is_active: item.is_active,
    quantity_on_hand: item.quantity_on_hand,
  };
}

/** Row menu for users who can restock but cannot adjust stock. */
export function RestockRowMenu({ stock }: { stock: PurchaseStock }) {
  const restock = useRestock();
  const trigger = useRef<HTMLButtonElement>(null);
  if (!restock) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={trigger}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${stock.stock_item_name}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent data-coms-ui="operational" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => restock.openRestock(stock, trigger.current)}
          >
            <PackagePlus aria-hidden="true" />
            Restock
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
