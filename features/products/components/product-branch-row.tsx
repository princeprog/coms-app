"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { SetupBranch } from "../schemas/product-setup.schema";

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
  const supported = branch.serviceTypes ?? ["DINE_IN", "TAKEAWAY"];
  const reason =
    branch.status === "inactive"
      ? "Inactive branch"
      : !services.some((s) => supported.includes(s))
        ? "No supported service selected"
        : "";
  const capability =
    supported
      .map((s) => (s === "DINE_IN" ? "Dine-in" : "Takeout"))
      .join(" · ") + (supported.length === 1 ? " only" : "");
  const id = "branch-" + branch.id;
  return (
    <Field
      orientation="horizontal"
      className="gap-3 px-4 py-2"
      data-disabled={disabled || (Boolean(reason) && !checked)}
    >
      <Checkbox
        id={id}
        aria-label={branch.name}
        aria-describedby={id + "-services"}
        checked={checked}
        disabled={disabled || (Boolean(reason) && !checked)}
        onCheckedChange={onChange}
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <FieldLabel htmlFor={id} className="min-w-0 break-words">
          {branch.name}
        </FieldLabel>
        <span
          id={id + "-services"}
          className="text-sm font-normal text-muted-foreground"
        >
          {reason || capability || "No supported services"}
        </span>
      </div>
    </Field>
  );
}
