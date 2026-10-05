"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
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
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  clearable?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const selectedLabel = selected ? format(selected, "PPP") : "Select a date";
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
            className="w-full justify-start font-normal"
          />
        }
      >
        <CalendarDays data-icon="inline-start" aria-hidden="true" />
        <span className="truncate">{selectedLabel}</span>
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
          captionLayout="dropdown"
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
