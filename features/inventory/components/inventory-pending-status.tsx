import { LoaderCircle } from "lucide-react";

export function InventoryPendingStatus() {
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      Updating inventory…
    </p>
  );
}
