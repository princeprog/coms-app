"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DispatchPostAction } from "@/features/dispatches/types/dispatch.types";

export function DispatchPostControl({
  dispatchId,
  action,
}: {
  dispatchId: string;
  action: DispatchPostAction;
}) {
  const router = useRouter();
  const retry = useRef<{ name: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [deliveredBy, setDeliveredBy] = useState("");
  const [error, setError] = useState("");

  async function confirm() {
    if (pending) return;
    const name = deliveredBy.trim();
    if (!name) {
      setError("Enter who is delivering this dispatch.");
      return;
    }
    if (retry.current?.name !== name)
      retry.current = { name, key: globalThis.crypto.randomUUID() };
    setError("");
    setPending(true);
    let result: Awaited<ReturnType<DispatchPostAction>>;
    try {
      result = await action(
        dispatchId,
        { delivered_by_name: name },
        retry.current.key,
      );
    } catch {
      result = {
        ok: false,
        error: "COMS could not send this dispatch. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (nextOpen) setError("");
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="default">
            Send dispatch
          </Button>
        }
      />
      <DialogContent data-coms-ui="operational">
        <DialogHeader>
          <DialogTitle>Send this dispatch?</DialogTitle>
          <DialogDescription>
            Confirm that this stock is leaving the commissary. Sending will
            deduct commissary inventory.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={`delivered-by-${dispatchId}`}>
            Delivered by
          </FieldLabel>
          <Input
            id={`delivered-by-${dispatchId}`}
            aria-required="true"
            maxLength={120}
            autoComplete="off"
            disabled={pending}
            value={deliveredBy}
            onChange={(event) => setDeliveredBy(event.target.value)}
          />
          <FieldDescription>
            The driver or runner who will hand the stock to the branch.
          </FieldDescription>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Keep as draft
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Sending…" : "Confirm dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
