import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";

export function SupplierReceiptLineActions({
  pending,
  atLineLimit,
  onAddLine,
}: {
  pending: boolean;
  atLineLimit: boolean;
  onAddLine: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={pending || atLineLimit}
        onClick={onAddLine}
      >
        Add stock item
      </Button>
      <FieldDescription>
        Recording this delivery immediately updates commissary inventory.
        Supplier delivery records cannot be edited after saving.
      </FieldDescription>
    </>
  );
}
