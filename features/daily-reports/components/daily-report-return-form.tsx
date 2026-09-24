import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DailyReportReturnForm({
  reportId,
  reason,
  pending,
  onReasonChange,
  onSubmit,
  onCancel,
}: {
  reportId: string;
  reason: string;
  pending: boolean;
  onReasonChange: (reason: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_auto_auto] sm:items-end"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`daily-report-return-${reportId}`}
          className="text-sm font-medium"
        >
          Reason for return
        </label>
        <Textarea
          id={`daily-report-return-${reportId}`}
          maxLength={500}
          required
          value={reason}
          disabled={pending}
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending || !reason.trim()}>
        {pending ? "Returning…" : "Confirm return"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </form>
  );
}
