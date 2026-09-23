"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DispatchCreateAction } from "@/features/dispatches/types/dispatch.types";

export function DispatchCreateControl({
  stockRequestId,
  action,
}: {
  stockRequestId: string;
  action: DispatchCreateAction;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDispatch() {
    if (pending) return;
    idempotencyKey.current ??= globalThis.crypto.randomUUID();
    setPending(true);
    setError(null);

    try {
      const result = await action(stockRequestId, idempotencyKey.current);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/dispatches/${result.dispatch_id}`);
      router.refresh();
    } catch {
      setError("COMS could not prepare this dispatch. Try again.");
    } finally {
      setPending(false);
    }
  }

  const workflowChanged = error?.toLowerCase().includes("workflow changed");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={createDispatch} disabled={pending}>
        {pending ? "Preparing dispatch…" : "Prepare dispatch"}
      </Button>
      {error && (
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          {workflowChanged && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/dispatches"
            >
              Review dispatches
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
