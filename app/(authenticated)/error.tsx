"use client";

import { Button } from "@/components/ui/button";

export default function AuthenticatedError({ reset }: { reset: () => void }) {
  return (
    <section
      className="m-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
      role="alert"
    >
      <h2 className="text-lg font-semibold">This page could not load</h2>
      <p className="text-sm text-muted-foreground">
        Your navigation is still available. Try loading the page again.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
