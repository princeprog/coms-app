"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  id,
  label,
  value,
  disabled = false,
  clearable = false,
  className,
  invalid = false,
  describedBy,
  captionLayout = "dropdown",
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  captionLayout?: "label" | "dropdown";
  /** Shown muted when no date is chosen; defaults to "Select a date". */
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const selectedLabel = selected
    ? format(selected, "PPP")
    : (placeholder ?? "Select a date");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`${label}: ${selectedLabel}`}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(
              "w-full min-w-0 justify-start font-normal",
              className,
            )}
          />
        }
      >
        <CalendarDays data-icon="inline-start" aria-hidden="true" />
        <span
          className={cn(
            "truncate",
            !selected && placeholder && "text-muted-foreground",
          )}
        >
          {selectedLabel}
        </span>
      </PopoverTrigger>
      <PopoverContent
        data-coms-ui="operational"
        align="start"
        className="w-auto gap-0 p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout={captionLayout}
          autoFocus
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
        {clearable && selected && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear date
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
