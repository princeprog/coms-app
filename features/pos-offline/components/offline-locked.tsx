import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OfflineRegister } from "../hooks/use-offline-register";

export function OfflineLocked({ register }: { register: OfflineRegister }) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Register locked</h2>
      <p className="text-sm text-muted-foreground">
        Saved sales and the order stay on this browser. Connect and sign in as
        the original cashier, then unlock to continue.
      </p>
      {register.error && (
        <p role="alert" className="text-sm text-destructive">
          {register.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          disabled={!register.online || register.pending}
          onClick={() => void register.unlock()}
        >
          {register.pending
            ? "Checking cashier…"
            : "Unlock with signed-in cashier"}
        </Button>
        <Link href="/" className="text-sm underline">
          Sign in
        </Link>
      </div>
    </section>
  );
}
