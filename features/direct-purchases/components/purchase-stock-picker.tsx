"use client";

import { stockUnitLabel } from "@/features/inventory/stock-unit-label";
import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { usePurchaseStock } from "../hooks/use-purchase-stock";
import type { PurchaseStock } from "../schemas/purchase.schema";

export function PurchaseStockPicker({
  id,
  selected,
  disabled,
  excluded,
  invalid = false,
  onSelect,
}: {
  id: string;
  selected?: PurchaseStock;
  disabled: boolean;
  excluded: Set<string>;
  invalid?: boolean;
  onSelect: (stock: PurchaseStock | null) => void;
}) {
  const lookup = usePurchaseStock();
  const [open, setOpen] = useState(false);
  return (
    <Combobox<PurchaseStock>
      items={lookup.data?.items ?? []}
      value={selected ?? null}
      disabled={disabled}
      filter={null}
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(item) => item.stock_item_name}
      isItemEqualToValue={(item, value) => item.id === value.id}
      onValueChange={onSelect}
      onInputValueChange={(value, details) => {
        if (details.reason === "input-change") lookup.setSearch(value);
      }}
    >
      <ComboboxInput
        id={id}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        placeholder="Search stock items"
        className="h-11 w-full [&_input]:h-full [&_input]:px-3"
      />
      <ComboboxContent data-coms-ui="operational">
        {lookup.isPending ? (
          <p role="status" className="p-3 text-sm">
            Loading stock items…
          </p>
        ) : lookup.isError ? (
          <div role="alert" className="space-y-2 p-3 text-sm">
            <p>Stock options could not be loaded.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lookup.refetch()}
            >
              Retry stock search
            </Button>
          </div>
        ) : (
          <>
            {lookup.data?.items.length === 0 && (
              <p role="status" className="p-3 text-sm">
                No matching active stock items.
              </p>
            )}
            <ComboboxList>
              {(item: PurchaseStock) => (
                <ComboboxItem
                  key={item.id}
                  value={item}
                  disabled={excluded.has(item.id) || item.is_active === false}
                >
                  {item.stock_item_name} · {stockUnitLabel(item.unit)}
                  {item.is_active === false && (
                    <span className="text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </ComboboxItem>
              )}
            </ComboboxList>
            {lookup.data && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-t p-2 text-xs"
                aria-label="Stock search pagination"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lookup.page <= 1}
                  onClick={() => lookup.setPage(lookup.page - 1)}
                >
                  Previous stock page
                </Button>
                <span>
                  Page {lookup.page} of{" "}
                  {Math.max(1, Math.ceil(lookup.data.total / 25))} ·{" "}
                  {lookup.data.total} items
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={lookup.page * 25 >= lookup.data.total}
                  onClick={() => lookup.setPage(lookup.page + 1)}
                >
                  Next stock page
                </Button>
              </div>
            )}
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
