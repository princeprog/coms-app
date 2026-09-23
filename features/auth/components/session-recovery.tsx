"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useRefreshSession } from "@/features/auth/hooks/mutations/use-refresh-session";
import { useLogout } from "@/features/auth/hooks/mutations/use-logout";
import { ApiRequestError } from "@/services/api-services";

export function SessionRecovery() {
  const recovery = useRefreshSession();
  const logout = useLogout();
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!started.current) {
      started.current = true;
      recovery.mutate();
    }
  }, [recovery]);

  const unsupported =
    recovery.error instanceof ApiRequestError && recovery.error.status === 428;
  const rejected =
    recovery.error instanceof ApiRequestError && recovery.error.status === 401;
  const error = logout.error ?? recovery.error;
  const message = logout.error
    ? "Sign out failed. Try again."
    : unsupported
      ? "This browser cannot safely restore your session. Sign in again to continue."
      : error instanceof ApiRequestError && error.status === 429
        ? `Too many session requests. Try again in ${error.retryAfterSeconds ?? 60} seconds.`
        : error instanceof ApiRequestError && error.status === 408
          ? error.message
          : "We could not reach the authentication service. Try again.";

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      {error && !rejected ? (
        <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Session recovery failed</h1>
          <p role="alert" className="text-sm text-muted-foreground">
            {message}
          </p>
          <Button
            type="button"
            disabled={recovery.isPending || logout.isPending}
            onClick={() => (unsupported ? logout.mutate() : recovery.mutate())}
          >
            {logout.isPending
              ? "Signing out…"
              : recovery.isPending
                ? "Retrying…"
                : unsupported
                  ? "Sign in again"
                  : "Try again"}
          </Button>
        </section>
      ) : (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          Restoring your session…
        </p>
      )}
    </main>
  );
}
