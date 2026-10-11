import type { ReactNode } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MenuListContextValue = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  description?: string;
  icon?: ReactNode;
};

export function MenuListContext({
  context,
  id,
  onChange,
}: {
  context: MenuListContextValue;
  id: string;
  onChange: (value: string) => void;
}) {
  const name = context.options.find(
    (option) => option.value === context.value,
  )?.label;

  return (
    <div className="flex min-w-0 flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:gap-6">
      <Field className="min-w-0 sm:max-w-sm">
        {context.options.length > 1 ? (
          <>
            <FieldLabel htmlFor={id}>{context.label}</FieldLabel>
            <Select
              value={context.value}
              onValueChange={(value) => value && onChange(value)}
            >
              <SelectTrigger
                id={id}
                className="w-full gap-3 px-3 data-[size=default]:h-11 sm:data-[size=default]:h-10"
              >
                {context.icon}
                <SelectValue>{() => name}</SelectValue>
              </SelectTrigger>
              <SelectContent
                data-coms-ui="operational"
                alignItemWithTrigger={false}
              >
                <SelectGroup>
                  {context.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">{context.label}</span>
            <p className="flex min-h-10 items-center gap-3 text-sm font-medium">
              {context.icon}
              <span className="min-w-0 wrap-break-word">{name}</span>
            </p>
          </>
        )}
      </Field>
      {context.description && (
        <p className="min-w-0 text-sm text-muted-foreground sm:mb-2 sm:border-l sm:pl-6">
          {context.description}
        </p>
      )}
    </div>
  );
}
