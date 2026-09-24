import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DailyReportDecimalField({
  id,
  label,
  value,
  disabled,
  signed = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  signed?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        maxLength={80}
        aria-required="true"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={signed ? `${id}-hint` : undefined}
      />
      {signed && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          Use a minus sign for a decrease.
        </p>
      )}
    </div>
  );
}

export function DailyReportReasonField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        maxLength={500}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
