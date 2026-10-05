import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function SupplierReceiptCreateFooter({
  pending,
  onCancel,
  lineCount,
  total,
}: {
  pending: boolean;
  onCancel: () => void;
  lineCount: number;
  total: string | null;
}) {
  return (
    <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4 sm:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm sm:mr-auto">
        <span className="text-muted-foreground">
          {lineCount} {lineCount === 1 ? "item" : "items"}
        </span>
        <span className="break-words font-semibold tabular-nums">
          Total cost: {total ?? "Enter quantities and costs"}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        Review delivery
      </Button>
    </DialogFooter>
  );
}
