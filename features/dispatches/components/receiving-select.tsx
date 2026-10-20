"use client";
import { CircleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const colors: Record<string, string> = {
  pending: "text-blue-600",
  AWAITING_COUNT: "text-amber-600",
  OVERDUE: "text-red-600",
  REVIEW: "text-violet-600",
};
export function ReceivingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger aria-label={label} className="h-10 min-w-36">
        <SelectValue>
          {options.find((option) => option.value === value)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent side="bottom" align="end" alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {colors[option.value] && (
              <CircleIcon
                aria-hidden="true"
                className={`size-3 fill-current ${colors[option.value]}`}
              />
            )}{" "}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
