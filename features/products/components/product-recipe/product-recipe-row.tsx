"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecipeUsageScope } from "../../schemas/product-recipe.schema";
import type { RecipeRow } from "../../services/product-recipe-rules";
import { RecipeScopeLabel } from "./recipe-scope-options";
import { RecipeStockPicker } from "./recipe-stock-picker";

const scopes: RecipeUsageScope[] = ["ALL", "DINE_IN", "TAKEAWAY"];

export function ProductRecipeRow({
  row,
  index,
  showScope,
  disabled,
  error,
  onUpdate,
  onRemove,
}: {
  row: RecipeRow;
  index: number;
  showScope: boolean;
  disabled: boolean;
  error?: { stock?: string; quantity?: string };
  onUpdate: (patch: Partial<Omit<RecipeRow, "key">>) => void;
  onRemove: () => void;
}) {
  const id = `recipe-${row.key}`;
  const line = index + 1;
  const name = row.stock?.stock_item_name;
  return (
    <li
      className={cn(
        "grid gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-start sm:border-0 sm:p-0",
        // Only freshly added lines animate; saved lines render in place.
        !row.stock &&
          "animate-in duration-200 ease-out-quint fade-in-0 motion-safe:slide-in-from-top-1",
      )}
    >
      <Field
        className={cn(
          "min-w-0 gap-2",
          showScope ? "sm:col-span-5" : "sm:col-span-8",
        )}
      >
        <FieldLabel htmlFor={id + "-stock"} className="sm:sr-only">
          Stock item<span className="sr-only">, line {line}</span>
        </FieldLabel>
        <RecipeStockPicker
          id={id + "-stock"}
          selected={row.stock}
          disabled={disabled}
          errorId={error?.stock ? id + "-stock-error" : undefined}
          onSelect={(stock) => onUpdate({ stock })}
        />
        {error?.stock && (
          <FieldError id={id + "-stock-error"}>{error.stock}</FieldError>
        )}
      </Field>
      <Field className="min-w-0 gap-2 sm:col-span-3">
        <FieldLabel htmlFor={id + "-quantity"} className="sm:sr-only">
          Quantity per sale<span className="sr-only">, line {line}</span>
        </FieldLabel>
        <InputGroup className="h-11">
          <InputGroupInput
            id={id + "-quantity"}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={row.quantity}
            disabled={disabled}
            aria-invalid={Boolean(error?.quantity)}
            aria-describedby={
              error?.quantity ? id + "-quantity-error" : undefined
            }
            onChange={(event) => onUpdate({ quantity: event.target.value })}
            className="tabular-nums"
          />
          {row.stock && (
            <InputGroupAddon align="inline-end">
              {row.stock.unit}
            </InputGroupAddon>
          )}
        </InputGroup>
        {error?.quantity && (
          <FieldError id={id + "-quantity-error"}>{error.quantity}</FieldError>
        )}
      </Field>
      {showScope && (
        <Field className="min-w-0 gap-2 sm:col-span-3">
          <FieldLabel htmlFor={id + "-scope"} className="sm:sr-only">
            Applies to<span className="sr-only">, line {line}</span>
          </FieldLabel>
          <Select
            value={row.scope}
            disabled={disabled}
            onValueChange={(scope) => scope && onUpdate({ scope })}
          >
            <SelectTrigger
              id={id + "-scope"}
              className="w-full data-[size=default]:h-11"
            >
              <SelectValue>
                {() => <RecipeScopeLabel scope={row.scope} />}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              data-coms-ui="operational"
              alignItemWithTrigger={false}
            >
              <SelectGroup>
                {scopes.map((scope) => (
                  <SelectItem key={scope} value={scope}>
                    <RecipeScopeLabel scope={scope} />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}
      <div className="flex justify-end sm:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-11 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          aria-label={`Remove ${name ?? `line ${line}`} from the recipe`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
