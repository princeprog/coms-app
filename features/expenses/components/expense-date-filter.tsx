"use client";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { manilaToday, monthRange } from "../services/expense-format";
import type { ExpenseQuery } from "../services/expense-query";

type DateRange = Pick<ExpenseQuery, "from" | "to">;

function lastMonthRange(): DateRange {
  const [year, month] = manilaToday().split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 2, 1));
  const end = new Date(Date.UTC(year, month - 1, 0));
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export function expenseRangeLabel({ from, to }: DateRange) {
  const start = parseISO(from);
  const end = parseISO(to);
  return from.slice(0, 4) === to.slice(0, 4)
    ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
    : `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function ExpenseDateFilter({
  query,
  apply,
}: {
  query: ExpenseQuery;
  apply: (change: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<DateRange>({
    from: query.from,
    to: query.to,
  });
  const invalid = !dates.from || !dates.to || dates.from > dates.to;
  function choose(range: DateRange) {
    apply(range);
    setOpen(false);
  }
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDates({ from: query.from, to: query.to });
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start px-3 sm:w-auto"
            aria-label={`Date range: ${expenseRangeLabel(query)} (Manila)`}
          />
        }
      >
        <CalendarDays aria-hidden="true" className="text-violet-600" />
        <span className="truncate">{expenseRangeLabel(query)}</span>
      </PopoverTrigger>
      <PopoverContent
        data-coms-ui="operational"
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))] gap-4 p-4"
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => choose(monthRange())}
          >
            <CalendarDays aria-hidden="true" className="text-blue-600" />
            This month
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => choose(lastMonthRange())}
          >
            <CalendarRange aria-hidden="true" className="text-violet-600" />
            Last month
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="expense-from" className="text-sm font-medium">
            From
          </label>
          <DatePicker
            id="expense-from"
            label="From"
            value={dates.from}
            onChange={(from) => setDates({ ...dates, from })}
          />
          <label htmlFor="expense-to" className="text-sm font-medium">
            To
          </label>
          <DatePicker
            id="expense-to"
            label="To"
            value={dates.to}
            onChange={(to) => setDates({ ...dates, to })}
          />
        </div>
        {dates.from && dates.to && dates.from > dates.to && (
          <p role="alert" className="text-sm text-destructive">
            End date must be on or after start date.
          </p>
        )}
        <Button type="button" disabled={invalid} onClick={() => choose(dates)}>
          Apply dates
        </Button>
      </PopoverContent>
    </Popover>
  );
}
