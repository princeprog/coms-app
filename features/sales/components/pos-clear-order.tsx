"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
export function PosClearOrder({
  disabled,
  onClear,
}: {
  disabled: boolean;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="ghost" size="sm" disabled={disabled} />
        }
      >
        <Trash2 aria-hidden="true" data-icon="inline-start" />
        Clear
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this order?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove all items and the amount received from this order.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            Clear order
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
