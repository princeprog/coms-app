"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export function StaffCreateFormFooter({
  pending,
  onCancel,
}: {
  pending: boolean;
  onCancel?: () => void;
}) {
  return (
    <DialogFooter className="mt-0 shrink-0 items-center border-t bg-muted/30 px-5 py-4 sm:px-8">
      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-md sm:min-w-24 sm:flex-none"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-11 flex-1 rounded-md sm:min-w-32 sm:flex-none"
          disabled={pending}
        >
          {pending ? "Creating staff…" : "Create staff"}
        </Button>
      </div>
    </DialogFooter>
  );
}
