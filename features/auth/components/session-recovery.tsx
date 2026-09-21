"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRefreshSession } from "@/features/auth/hooks/mutations/use-refresh-session";
import { ApiRequestError } from "@/services/api-services";

export function SessionRecovery() {
  const router = useRouter();
  const mutation = useRefreshSession();
  const started = React.useRef(false);

  const start = React.useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  React.useEffect(() => {
    if (!started.current) {
      started.current = true;
      start();
    }
  }, [start]);

  React.useEffect(() => {
    if (
      mutation.error instanceof ApiRequestError &&
      mutation.error.status === 401
    ) {
      router.replace("/");
    }
  }, [mutation.error, router]);

  if (
    mutation.error &&
    !(
      mutation.error instanceof ApiRequestError && mutation.error.status === 401
    )
  ) {
    return (
      <main className="flex min-h-svh items-center justify-center px-4">
        <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Session recovery failed</h1>
          <p role="alert" className="text-sm text-muted-foreground">
            We could not reach the authentication service. Try again.
          </p>
          <Button type="button" onClick={start} disabled={mutation.isPending}>
            {mutation.isPending ? "Retrying…" : "Try again"}
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        Restoring your session…
      </p>
    </main>
  );
}
