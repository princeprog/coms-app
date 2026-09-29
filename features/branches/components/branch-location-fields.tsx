import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BranchDatePicker } from "@/features/branches/components/branch-date-picker";

export function BranchLocationFields({
  idPrefix,
  branchName,
  address,
  dateOpened,
  hasDineIn,
  disabled,
  useDatePicker = false,
  onBranchNameChange,
  onAddressChange,
  onDateOpenedChange,
  onHasDineInChange,
}: {
  idPrefix: string;
  branchName: string;
  address: string;
  dateOpened: string;
  hasDineIn: boolean;
  disabled: boolean;
  useDatePicker?: boolean;
  onBranchNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onDateOpenedChange: (value: string) => void;
  onHasDineInChange: (value: boolean) => void;
}) {
  return (
    <FieldGroup className="gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-name`}>Branch name</FieldLabel>
          <Input
            id={`${idPrefix}-name`}
            required
            minLength={2}
            maxLength={160}
            value={branchName}
            disabled={disabled}
            onChange={(event) => onBranchNameChange(event.currentTarget.value)}
            placeholder="Manila South"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-address`}>Address</FieldLabel>
          <Input
            id={`${idPrefix}-address`}
            maxLength={1000}
            value={address}
            disabled={disabled}
            onChange={(event) => onAddressChange(event.currentTarget.value)}
            placeholder="Street, city"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-date-opened`}>
            Date opened
          </FieldLabel>
          {useDatePicker ? (
            <BranchDatePicker
              id={`${idPrefix}-date-opened`}
              value={dateOpened}
              disabled={disabled}
              onChange={onDateOpenedChange}
            />
          ) : (
            <Input
              id={`${idPrefix}-date-opened`}
              type="date"
              value={dateOpened}
              disabled={disabled}
              onChange={(event) =>
                onDateOpenedChange(event.currentTarget.value)
              }
            />
          )}
        </Field>
      </div>
      <Field orientation="horizontal" className="items-center justify-between">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${idPrefix}-dine-in`}>
            Dine-in available
          </FieldLabel>
          <FieldDescription>
            Indicate whether this branch offers dine-in service.
          </FieldDescription>
        </div>
        <Switch
          id={`${idPrefix}-dine-in`}
          checked={hasDineIn}
          disabled={disabled}
          onCheckedChange={onHasDineInChange}
        />
      </Field>
    </FieldGroup>
  );
}
