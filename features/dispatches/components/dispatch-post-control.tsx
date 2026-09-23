"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const idempotencyKey = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (pending) return;
    idempotencyKey.current ??= globalThis.crypto.randomUUID();
    setError("");
    setPending(true);
    let result: Awaited<ReturnType<DispatchPostAction>>;
    try {
      result = await action(dispatchId, idempotencyKey.current);
    } catch {
      result = {
        ok: false,
        error: "COMS could not post this dispatch. Try again.",
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
            Post dispatch
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post this dispatch?</DialogTitle>
          <DialogDescription>
            Posting will reduce commissary stock and begin branch transit for
            every approved quantity. The movement will be recorded in inventory
            history.
          </DialogDescription>
        </DialogHeader>
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
            {pending ? "Posting…" : "Confirm dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
