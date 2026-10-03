"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useDispatchStockSearch } from "../hooks/use-dispatch-stock-search";
import type { DispatchStockOption } from "../types/dispatch.types";

export function DispatchStockPicker({
  id,
  selected,
  disabled,
  excluded,
  availabilityVisible,
  onSelect,
}: {
  id: string;
  selected?: DispatchStockOption;
  disabled: boolean;
  excluded: Set<string>;
  availabilityVisible: boolean;
  onSelect: (stock: DispatchStockOption | null) => void;
}) {
  const lookup = useDispatchStockSearch(availabilityVisible);
  const [open, setOpen] = useState(false);
  return (
    <Combobox<DispatchStockOption>
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
        placeholder="Search stock items"
        className="w-full"
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
              {(item: DispatchStockOption) => (
                <ComboboxItem
                  key={item.id}
                  value={item}
                  disabled={excluded.has(item.id) || item.is_active === false}
                >
                  {item.stock_item_name} · {item.unit}
                  {item.is_active === false && (
                    <span className="text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                  {availabilityVisible && item.quantity_on_hand != null && (
                    <span className="text-xs text-muted-foreground">
                      Available: {item.quantity_on_hand} {item.unit}
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
