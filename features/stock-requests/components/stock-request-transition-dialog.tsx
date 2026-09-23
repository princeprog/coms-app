"use client";

import { useState } from "react";
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
import type {
  StockRequestTransition,
  StockRequestTransitionAction,
  StockRequestTransitionResult,
} from "@/features/stock-requests/types/stock-request.types";

const transitionCopy: Record<
  StockRequestTransition,
  { trigger: string; heading: string; confirm: string; description: string }
> = {
  approve: {
    trigger: "Approve request",
    heading: "Approve stock request?",
    confirm: "Confirm approval",
    description:
      "This records approval so commissary staff can prepare the dispatch. Stock will change when the dispatch is posted.",
  },
  reject: {
    trigger: "Reject request",
    heading: "Reject stock request?",
    confirm: "Confirm rejection",
    description:
      "This records the rejection in request history. No inventory will change.",
  },
  cancel: {
    trigger: "Cancel request",
    heading: "Cancel stock request?",
    confirm: "Confirm cancellation",
    description:
      "The pending request will be cancelled and kept in request history.",
  },
};

export function StockRequestTransitionDialog({
  requestId,
  transition,
  action,
}: {
  requestId: string;
  transition: StockRequestTransition;
  action: StockRequestTransitionAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const copy = transitionCopy[transition];

  async function confirm() {
    setError("");
    setPending(true);
    let result: StockRequestTransitionResult;
    try {
      result = await action(requestId, transition);
    } catch {
      result = {
        ok: false,
        error: "COMS could not update this stock request. Try again.",
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
          <Button
            type="button"
            variant={transition === "reject" ? "destructive" : "outline"}
          >
            {copy.trigger}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.heading}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
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
            Keep request
          </Button>
          <Button
            type="button"
            variant={transition === "reject" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? "Saving…" : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
