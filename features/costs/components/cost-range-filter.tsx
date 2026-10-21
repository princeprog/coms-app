"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import {
  activePreset,
  presetRange,
  type RangePreset,
} from "../services/cost-format";

const presetLabels: Record<RangePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  month: "This month",
};

export function CostRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  const preset = activePreset(from, to);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <div
          role="group"
          aria-label="Date range"
          className="flex flex-wrap gap-2"
        >
          {(Object.keys(presetLabels) as RangePreset[]).map((key) => (
            <Button
              key={key}
              type="button"
              variant={preset === key ? "secondary" : "outline"}
              aria-pressed={preset === key}
              className="h-11 active:scale-97"
              onClick={() => onChange(presetRange(key))}
            >
              {presetLabels[key]}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-48">
          <DatePicker
            id="cost-from"
            label="From business day"
            value={from}
            className="h-11"
            onChange={(value) => value && onChange({ from: value, to })}
          />
        </div>
        <div className="w-full sm:w-48">
          <DatePicker
            id="cost-to"
            label="To business day"
            value={to}
            className="h-11"
            onChange={(value) => value && onChange({ from, to: value })}
          />
        </div>
      </div>
      {from > to && (
        <p role="alert" className="text-sm text-destructive">
          The end date must be on or after the start date.
        </p>
      )}
    </div>
  );
}
