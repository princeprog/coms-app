"use client";
import { Ban, ShoppingBag, Utensils } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { SetupBranch } from "../schemas/product-setup.schema";
import { getBranchAvailability } from "../product-branch-availability";

const serviceMeta = {
  DINE_IN: {
    label: "Dine-in",
    icon: Utensils,
    color: "text-blue-600 dark:text-blue-400",
  },
  TAKEAWAY: {
    label: "Takeout",
    icon: ShoppingBag,
    color: "text-amber-600 dark:text-amber-400",
  },
} as const;

export function ProductBranchRow({
  branch,
  checked,
  services,
  disabled,
  onChange,
}: {
  branch: SetupBranch;
  checked: boolean;
  services: ServiceType[];
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { supported, reason } = getBranchAvailability(branch, services);
  const locked = disabled || (Boolean(reason) && !checked);
  const id = "branch-" + branch.id;
  return (
    <Field
      orientation="horizontal"
      data-disabled={locked}
      className={cn(
        "relative h-full items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        checked
          ? "border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10"
          : !locked && "hover:bg-muted/50",
      )}
    >
      <Checkbox
        id={id}
        className="z-10 mt-0.5"
        aria-label={branch.name}
        aria-describedby={id + "-services"}
        checked={checked}
        disabled={locked}
        onCheckedChange={onChange}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <FieldLabel
          htmlFor={id}
          className={cn(
            "leading-snug break-words after:absolute after:inset-0",
            locked ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          {branch.name}
        </FieldLabel>
        <span
          id={id + "-services"}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground group-data-[disabled=true]/field:opacity-50"
        >
          {reason ? (
            <span className="inline-flex items-center gap-1">
              <Ban className="size-3.5" aria-hidden="true" />
              {reason}
            </span>
          ) : supported.length ? (
            supported.map((service, index) => {
              const { label, icon: Icon, color } = serviceMeta[service];
              return [
                index > 0 && " ",
                <span key={service} className="inline-flex items-center gap-1">
                  <Icon className={cn("size-3.5", color)} aria-hidden="true" />
                  {label + (supported.length === 1 ? " only" : "")}
                </span>,
              ];
            })
          ) : (
            "No supported services"
          )}
        </span>
      </span>
    </Field>
  );
}
