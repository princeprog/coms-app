"use client";

import { Button } from "@/components/ui/button";
import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRefreshSession } from "@/features/auth/hooks/mutations/use-refresh-session";
import { subscribeToSessionRecovery } from "@/features/auth/services/auth-coordination";

export default function AuthenticatedError({ reset }: { reset: () => void }) {
  const recovery = useRefreshSession(reset);
  const router = useRouter();
  useEffect(
    () =>
      subscribeToSessionRecovery(() => {
        startTransition(() => {
          router.refresh();
          reset();
        });
      }),
    [reset, router],
  );
  return (
    <section
      className="m-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
      role="alert"
    >
      <h2 className="text-lg font-semibold">This page could not load</h2>
      <p className="text-sm text-muted-foreground">
        Your navigation is still available. Try loading the page again.
      </p>
      {recovery.error ? (
        <p className="text-sm text-muted-foreground">
          We could not restore your session. Please try again.
        </p>
      ) : null}
      <Button
        type="button"
        disabled={recovery.isPending}
        onClick={() => recovery.mutate()}
      >
        {recovery.isPending ? "Restoring session…" : "Try again"}
      </Button>
    </section>
  );
}
