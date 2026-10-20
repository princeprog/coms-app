"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { salesHistoryDates } from "../services/sales-history-filters";
import type { SalesPageFilters } from "../services/sales-page-params";

export function SalesHistoryDateFilter({
  filters,
  onChange,
}: {
  filters: SalesPageFilters;
  onChange: (value: Partial<SalesPageFilters>) => void;
}) {
  const dates = salesHistoryDates(filters);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(dates.dateFrom ?? "");
  const [to, setTo] = useState(dates.dateTo ?? "");
  function apply(value: Partial<SalesPageFilters>) {
    onChange(value);
    setOpen(false);
  }
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setFrom(dates.dateFrom ?? "");
          setTo(dates.dateTo ?? "");
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start"
            aria-label="Date range"
          />
        }
      >
        <CalendarDays aria-hidden="true" className="text-violet-600" />
        {filters.historyPeriod === "all"
          ? "All dates"
          : filters.historyPeriod === "custom"
            ? `${filters.historyFrom} – ${filters.historyTo}`
            : "Today"}
      </PopoverTrigger>
      <PopoverContent
        data-coms-ui="operational"
        align="start"
        className="w-80 gap-4"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              apply({
                historyPeriod: "today",
                historyFrom: undefined,
                historyTo: undefined,
              })
            }
          >
            <CalendarDays aria-hidden="true" className="text-blue-600" />
            Today
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              apply({
                historyPeriod: "all",
                historyFrom: undefined,
                historyTo: undefined,
              })
            }
          >
            <CalendarRange aria-hidden="true" className="text-violet-600" />
            All dates
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="history-from" className="text-sm font-medium">
            From
          </label>
          <DatePicker
            id="history-from"
            label="From"
            value={from}
            onChange={setFrom}
          />
          <label htmlFor="history-to" className="text-sm font-medium">
            To
          </label>
          <DatePicker id="history-to" label="To" value={to} onChange={setTo} />
        </div>
        {from && to && from > to && (
          <p role="alert" className="text-sm text-destructive">
            End date must be on or after start date.
          </p>
        )}
        <Button
          disabled={!from || !to || from > to}
          onClick={() =>
            apply({ historyPeriod: "custom", historyFrom: from, historyTo: to })
          }
        >
          Apply dates
        </Button>
      </PopoverContent>
    </Popover>
  );
}
