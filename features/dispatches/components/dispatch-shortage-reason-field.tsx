import { Textarea } from "@/components/ui/textarea";

export function DispatchShortageReasonField({
  dispatchId,
  reason,
  disabled,
  onReasonChange,
}: {
  dispatchId: string;
  reason: string;
  disabled: boolean;
  onReasonChange: (reason: string) => void;
}) {
  const inputId = `shortage-reason-${dispatchId}`;

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium" htmlFor={inputId}>
        Reason for shortage closure
      </label>
      <Textarea
        id={inputId}
        maxLength={500}
        disabled={disabled}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      <p className="text-sm text-muted-foreground">Maximum 500 characters.</p>
    </div>
  );
}
