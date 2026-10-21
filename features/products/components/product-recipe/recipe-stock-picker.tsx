"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useRecipeStock } from "../../hooks/use-recipe-stock";
import type { RecipeStock } from "../../schemas/product-recipe.schema";

const PAGE_SIZE = 25;

export function RecipeStockPicker({
  id,
  selected,
  disabled,
  errorId,
  onSelect,
}: {
  id: string;
  selected: RecipeStock | null;
  disabled: boolean;
  errorId?: string;
  onSelect: (stock: RecipeStock | null) => void;
}) {
  const [open, setOpen] = useState(false);
  // Query only once opened so long recipes don't search per row on load.
  const lookup = useRecipeStock(open);
  const total = lookup.data?.total ?? 0;
  const first = (lookup.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(lookup.page * PAGE_SIZE, total);
  return (
    <Combobox<RecipeStock>
      items={lookup.data?.items ?? []}
      value={selected}
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
        aria-invalid={Boolean(errorId)}
        aria-describedby={errorId}
        placeholder="Search stock items"
        className="h-11 w-full bg-background [&_input]:h-full [&_input]:px-3"
      />
      <ComboboxContent data-coms-ui="operational" className="min-w-72">
        {lookup.isError ? (
          <div role="alert" className="space-y-2 p-3 text-sm">
            <p>Stock items could not be loaded.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lookup.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : lookup.isPending ? (
          <p role="status" className="px-3 py-4 text-sm text-muted-foreground">
            Loading stock items…
          </p>
        ) : (
          <>
            {lookup.data?.items.length === 0 && (
              <p
                role="status"
                className="px-3 py-4 text-sm text-muted-foreground"
              >
                No matching stock items.
              </p>
            )}
            <ComboboxList>
              {(item: RecipeStock) => (
                <ComboboxItem key={item.id} value={item}>
                  <span className="min-w-0 flex-1 truncate">
                    {item.stock_item_name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.unit}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
                <span className="pl-1">
                  {first}–{last} of {total}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous stock page"
                    disabled={lookup.page <= 1}
                    onClick={() => lookup.setPage(lookup.page - 1)}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next stock page"
                    disabled={last >= total}
                    onClick={() => lookup.setPage(lookup.page + 1)}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
