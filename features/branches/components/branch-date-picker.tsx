"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDaysIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function BranchDatePicker({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const selectedLabel = selected ? format(selected, "PPP") : "No date selected";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`Date opened: ${selectedLabel}`}
            className="w-full justify-start gap-2 rounded-md text-left font-normal"
          />
        }
      >
        <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={selected ? undefined : "text-muted-foreground"}>
          {selected ? selectedLabel : "Select a date"}
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
          captionLayout="dropdown"
          autoFocus
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
        {selected && (
          <div className="border-t p-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
