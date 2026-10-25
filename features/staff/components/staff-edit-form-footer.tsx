import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function StaffEditFormFooter({
  pending,
  disabled,
  label,
  pendingLabel,
  onCancel,
}: {
  pending: boolean;
  disabled?: boolean;
  label: string;
  pendingLabel: string;
  onCancel?: () => void;
}) {
  return (
    <DialogFooter className="m-0 shrink-0 px-5 py-4 sm:px-8">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
      <Button type="submit" className="h-10" disabled={pending || disabled}>
        {pending ? pendingLabel : label}
      </Button>
    </DialogFooter>
  );
}
