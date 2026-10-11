"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Utensils } from "lucide-react";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
export function PosServicePicker({
  value,
  options,
  onChange,
  disabled,
}: {
  value: ServiceType | null;
  options: ServiceType[];
  onChange: (value: ServiceType) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="sr-only">Service type</legend>
      <div
        role="group"
        aria-label="Service type"
        className="flex gap-1 rounded-lg border bg-muted/50 p-1"
      >
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant="ghost"
            className={
              value === option
                ? "h-12 min-w-0 flex-1 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white"
                : "h-12 min-w-0 flex-1"
            }
            aria-pressed={value === option}
            disabled={disabled}
            onClick={() => onChange(option)}
          >
            {option === "DINE_IN" ? (
              <Utensils aria-hidden="true" data-icon="inline-start" />
            ) : (
              <ShoppingBag aria-hidden="true" data-icon="inline-start" />
            )}
            {option === "DINE_IN" ? "Dine-in" : "Takeout"}
          </Button>
        ))}
      </div>
      {!value && (
        <p className="text-sm text-muted-foreground">
          Choose a service type before adding products.
        </p>
      )}
      {value && (
        <Link
          href="#pos-menu-heading"
          className="w-fit text-sm font-medium text-primary underline underline-offset-4 xl:hidden"
        >
          Browse products
        </Link>
      )}
    </fieldset>
  );
}
