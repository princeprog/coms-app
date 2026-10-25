import type { ReactNode } from "react";
import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BranchDatePicker } from "@/features/branches/components/branch-date-picker";

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="border-b pb-2 text-sm font-semibold">
      {children}
    </h3>
  );
}

function ServiceToggle({
  id,
  label,
  icon,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <FieldLabel
      htmlFor={id}
      className="cursor-pointer rounded-lg border p-3 transition-[background-color,border-color] duration-150 ease-out has-[[data-checked]]:border-primary/50 has-[[data-checked]]:bg-primary/5"
    >
      <Field orientation="horizontal" className="items-center gap-3">
        <span aria-hidden="true" className="flex [&>svg]:size-5">
          {icon}
        </span>
        <FieldTitle>{label}</FieldTitle>
        <Switch
          id={id}
          className="ml-auto"
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
        />
      </Field>
    </FieldLabel>
  );
}

export function BranchLocationFields({
  idPrefix,
  branchName,
  address,
  dateOpened,
  hasDineIn,
  hasTakeout,
  disabled,
  onBranchNameChange,
  onAddressChange,
  onDateOpenedChange,
  onHasDineInChange,
  onHasTakeoutChange,
}: {
  idPrefix: string;
  branchName: string;
  address: string;
  dateOpened: string;
  hasDineIn: boolean;
  hasTakeout: boolean;
  disabled: boolean;
  onBranchNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onDateOpenedChange: (value: string) => void;
  onHasDineInChange: (value: boolean) => void;
  onHasTakeoutChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <section
        aria-labelledby={`${idPrefix}-details`}
        className="flex flex-col gap-4"
      >
        <SectionTitle id={`${idPrefix}-details`}>Branch details</SectionTitle>
        <Field className="gap-2">
          <div className="flex items-center gap-1">
            <FieldLabel htmlFor={`${idPrefix}-name`}>Branch name</FieldLabel>
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </div>
          <Input
            id={`${idPrefix}-name`}
            className="h-11"
            required
            minLength={2}
            maxLength={160}
            value={branchName}
            disabled={disabled}
            onChange={(event) => onBranchNameChange(event.currentTarget.value)}
            placeholder="e.g. Manila South"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor={`${idPrefix}-address`}>Address</FieldLabel>
          <Input
            id={`${idPrefix}-address`}
            className="h-11"
            maxLength={1000}
            value={address}
            disabled={disabled}
            onChange={(event) => onAddressChange(event.currentTarget.value)}
            placeholder="Street, city, province"
          />
        </Field>
        <Field className="gap-2 sm:max-w-[calc(50%-0.5rem)]">
          <FieldLabel htmlFor={`${idPrefix}-date-opened`}>
            Date opened
          </FieldLabel>
          <BranchDatePicker
            id={`${idPrefix}-date-opened`}
            value={dateOpened}
            disabled={disabled}
            onChange={onDateOpenedChange}
          />
        </Field>
      </section>
      <section
        aria-labelledby={`${idPrefix}-services`}
        className="flex flex-col gap-4"
      >
        <SectionTitle id={`${idPrefix}-services`}>Services</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <ServiceToggle
            id={`${idPrefix}-dine-in`}
            label="Dine-in"
            icon={
              <UtensilsCrossed className="text-orange-600 dark:text-orange-400" />
            }
            checked={hasDineIn}
            disabled={disabled}
            onChange={onHasDineInChange}
          />
          <ServiceToggle
            id={`${idPrefix}-takeout`}
            label="Takeout"
            icon={<ShoppingBag className="text-sky-600 dark:text-sky-400" />}
            checked={hasTakeout}
            disabled={disabled}
            onChange={onHasTakeoutChange}
          />
        </div>
        {!hasDineIn && !hasTakeout && (
          <p className="text-sm text-destructive">
            Choose at least one service.
          </p>
        )}
      </section>
    </div>
  );
}
