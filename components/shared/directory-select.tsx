"use client";

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
import { cn } from "@/lib/utils";

export function DirectorySelect({
  id,
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  alignItemWithTrigger = true,
  className,
}: {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string; icon?: ReactNode }>;
  onChange: (value: string) => void;
  hideLabel?: boolean;
  alignItemWithTrigger?: boolean;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);
  const hasIcons = options.some((option) => option.icon);
  return (
    <Field className={cn("min-w-0 sm:w-48 sm:shrink-0", className)}>
      <FieldLabel className={cn(hideLabel && "sr-only w-px!")} htmlFor={id}>
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {() => selected && <DirectoryOptionLabel option={selected} />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          data-coms-ui="operational"
          alignItemWithTrigger={alignItemWithTrigger}
          className={hasIcons ? "min-w-60" : undefined}
        >
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <DirectoryOptionLabel option={option} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function DirectoryOptionLabel({
  option,
}: {
  option: { label: string; icon?: ReactNode };
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.icon && (
        <span
          aria-hidden="true"
          className="flex shrink-0 text-muted-foreground [&>svg]:size-4 [&_svg_*]:text-inherit!"
        >
          {option.icon}
        </span>
      )}
      <span className="truncate">{option.label}</span>
    </span>
  );
}
