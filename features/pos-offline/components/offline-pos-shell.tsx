"use client";
import { useOfflineRegister } from "../hooks/use-offline-register";
import { OfflineCheckout } from "./offline-checkout";
import { OfflineRegisterStatus } from "./offline-register-status";
import { OfflineLocked } from "./offline-locked";

/** Public HTML stays generic. Identity, menu, cart and outbox are read after hydration. */
export function OfflinePosShell() {
  const register = useOfflineRegister();
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-screen-2xl flex-col gap-6 bg-background p-4 text-foreground sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">COMS · Prepared register</h1>
          <p className="text-sm text-muted-foreground">
            {register.state?.snapshot.branch.name ??
              "Cash checkout on this device"}
          </p>
        </div>
        <a className="text-sm underline" href="/pos">
          Online Point of Sale
        </a>
      </header>
      {register.loading ? (
        <div
          className="h-64 animate-pulse rounded-lg bg-muted"
          role="status"
          aria-label="Reading prepared register"
        />
      ) : register.locked ? (
        <OfflineLocked register={register} />
      ) : register.state ? (
        <>
          <OfflineRegisterStatus register={register} />
          <OfflineCheckout register={register} state={register.state} />
        </>
      ) : (
        <section className="space-y-3 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">
            No prepared register available
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect to COMS, open your shift and prepare this approved browser
            from Point of Sale. New shifts and noncash payments require a
            connection.
          </p>
          {register.error && (
            <p role="alert" className="text-sm text-destructive">
              {register.error}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
